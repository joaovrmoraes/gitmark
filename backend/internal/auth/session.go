// Package auth holds the GitHub OAuth session store. Sessions live in memory
// (same pragmatic choice as the cache) — fine for a single instance; swap for
// Redis when GitMark scales horizontally.
package auth

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"
)

// User is the authenticated GitHub identity surfaced to the frontend.
type User struct {
	Login     string `json:"login"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatarUrl"`
}

// Session pairs the user's GitHub access token (kept server-side, never sent to
// the browser) with their identity.
type Session struct {
	Token string
	User  User
}

// TTL bounds how long a session is valid server-side (mirrors the cookie).
const TTL = 7 * 24 * time.Hour

type stored struct {
	sess      Session
	expiresAt time.Time
}

type Store struct {
	mu sync.RWMutex
	m  map[string]stored
}

func NewStore() *Store {
	s := &Store{m: make(map[string]stored)}
	go s.reap()
	return s
}

func (s *Store) Create(sess Session) (string, error) {
	id, err := randomID()
	if err != nil {
		return "", err
	}
	s.mu.Lock()
	s.m[id] = stored{sess: sess, expiresAt: time.Now().Add(TTL)}
	s.mu.Unlock()
	return id, nil
}

func (s *Store) Get(id string) (Session, bool) {
	s.mu.RLock()
	e, ok := s.m[id]
	s.mu.RUnlock()
	if !ok || time.Now().After(e.expiresAt) {
		return Session{}, false
	}
	return e.sess, true
}

// reap evicts expired sessions so the map can't grow unbounded.
func (s *Store) reap() {
	t := time.NewTicker(time.Hour)
	defer t.Stop()
	for range t.C {
		now := time.Now()
		s.mu.Lock()
		for id, e := range s.m {
			if now.After(e.expiresAt) {
				delete(s.m, id)
			}
		}
		s.mu.Unlock()
	}
}

func (s *Store) Delete(id string) {
	s.mu.Lock()
	delete(s.m, id)
	s.mu.Unlock()
}

func randomID() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
