//go:build integration

package github

import (
	"context"
	"io"
	"strings"
	"testing"

	"github.com/joaovrmoraes/gitmark/backend/internal/cache"
)

// Integration test against the real public repo the user reported. Hits the
// network (unauthenticated, public). Run: go test -run TestRawStreamLargePDF ./internal/github/
func TestRawStreamLargePDF(t *testing.T) {
	c := NewClient("https://api.github.com", cache.NewMemory())
	ctx := context.Background()

	nodes, err := c.Tree(ctx, "", "KAYOKG", "BibliotecaDev", "")
	if err != nil {
		t.Fatalf("tree: %v", err)
	}

	var sha, path string
	var size int
	for _, n := range nodes {
		if n.Type == "blob" && strings.HasSuffix(strings.ToLower(n.Path), ".pdf") && n.Size > 1_000_000 {
			sha, path, size = n.SHA, n.Path, n.Size
			break
		}
	}
	if sha == "" {
		t.Skip("no >1MB pdf found")
	}
	t.Logf("picked %q (%d bytes)", path, size)

	// The fix: Blobs API streams the whole file.
	res, err := c.RawStream(ctx, "", "KAYOKG", "BibliotecaDev", sha, path, "")
	if err != nil {
		t.Fatalf("blobs RawStream failed: %v", err)
	}
	n, _ := io.Copy(io.Discard, res.Body)
	res.Body.Close()
	t.Logf("blobs API streamed %d bytes", n)
	if n < 1_000_000 {
		t.Fatalf("expected >1MB streamed, got %d", n)
	}

	// The old path: Contents API (no sha) should 403 "too large".
	_, err2 := c.RawStream(ctx, "", "KAYOKG", "BibliotecaDev", "", path, "")
	t.Logf("contents API (no sha) → %v", err2)
	if err2 == nil {
		t.Logf("note: contents API unexpectedly succeeded for this file")
	}
}
