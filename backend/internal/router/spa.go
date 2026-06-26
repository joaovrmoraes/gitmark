package router

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// spaHandler serves the built frontend from webDir. Real files (assets, the
// pdf worker, icons, manifest) are served as-is; every other path falls back to
// index.html so client-side routes like /signin, /repos and /browse/... work on
// direct load and hard refresh. This is what makes the single-origin deploy
// immune to "404 after deploy".
func spaHandler(webDir string) gin.HandlerFunc {
	root := filepath.Clean(webDir)
	index := filepath.Join(root, "index.html")

	return func(c *gin.Context) {
		if c.Request.Method != http.MethodGet && c.Request.Method != http.MethodHead {
			c.Status(http.StatusNotFound)
			return
		}

		clean := filepath.Clean(c.Request.URL.Path)
		full := filepath.Join(root, clean)

		// Guard against path traversal escaping the web root.
		if full != root && !strings.HasPrefix(full, root+string(os.PathSeparator)) {
			c.File(index)
			return
		}

		if clean != "/" && clean != "." {
			if fi, err := os.Stat(full); err == nil && !fi.IsDir() {
				c.File(full)
				return
			}
		}
		// SPA fallback.
		c.File(index)
	}
}
