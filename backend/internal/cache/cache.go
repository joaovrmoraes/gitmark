// Package cache provides a tiny in-memory TTL store used to shield the GitHub
// API from repeated reads and stay under rate limits. The Store interface is
// intentionally small so it can be swapped for Redis later without touching
// callers (see GitMark architecture: tree 5min / content 10min TTLs).
package cache

import (
	"sync"
	"time"
)

type Store interface {
	Get(key string) ([]byte, bool)
	Set(key string, value []byte, ttl time.Duration)
}

type entry struct {
	value     []byte
	expiresAt time.Time
}

// Memory is a goroutine-safe in-memory implementation of Store.
type Memory struct {
	mu    sync.RWMutex
	items map[string]entry
}

func NewMemory() *Memory {
	m := &Memory{items: make(map[string]entry)}
	go m.reap()
	return m
}

func (m *Memory) Get(key string) ([]byte, bool) {
	m.mu.RLock()
	e, ok := m.items[key]
	m.mu.RUnlock()
	if !ok || time.Now().After(e.expiresAt) {
		return nil, false
	}
	return e.value, true
}

func (m *Memory) Set(key string, value []byte, ttl time.Duration) {
	m.mu.Lock()
	m.items[key] = entry{value: value, expiresAt: time.Now().Add(ttl)}
	m.mu.Unlock()
}

// reap periodically evicts expired entries so the map does not grow unbounded.
func (m *Memory) reap() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		m.mu.Lock()
		for k, e := range m.items {
			if now.After(e.expiresAt) {
				delete(m.items, k)
			}
		}
		m.mu.Unlock()
	}
}
