// Package auth holds the GitHub OAuth session store. Sessions live in memory
// (same pragmatic choice as the cache) — fine for a single instance; swap for
// Redis when GitMark scales horizontally.
package auth

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
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

type Store struct {
	mu sync.RWMutex
	m  map[string]Session
}

func NewStore() *Store {
	return &Store{m: make(map[string]Session)}
}

func (s *Store) Create(sess Session) (string, error) {
	id, err := randomID()
	if err != nil {
		return "", err
	}
	s.mu.Lock()
	s.m[id] = sess
	s.mu.Unlock()
	return id, nil
}

func (s *Store) Get(id string) (Session, bool) {
	s.mu.RLock()
	sess, ok := s.m[id]
	s.mu.RUnlock()
	return sess, ok
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
