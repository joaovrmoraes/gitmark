package github

// Repo is the trimmed-down view of a GitHub repository the frontend needs.
type Repo struct {
	ID            int64  `json:"id"`
	Name          string `json:"name"`
	FullName      string `json:"fullName"`
	Owner         string `json:"owner"`
	Description   string `json:"description"`
	Private       bool   `json:"private"`
	DefaultBranch string `json:"defaultBranch"`
	UpdatedAt     string `json:"updatedAt"`
	Stars         int    `json:"stars"`
}

// TreeNode is a single entry (file or directory) within a repository tree.
type TreeNode struct {
	Path string `json:"path"`
	// Type is "blob" (file) or "tree" (directory).
	Type string `json:"type"`
	Size int    `json:"size"`
	SHA  string `json:"sha"`
}

// FileContent is a rendered-ready markdown (or text) file payload.
type FileContent struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

// ---- Raw GitHub API response shapes (internal) ----

type ghRepo struct {
	ID            int64  `json:"id"`
	Name          string `json:"name"`
	FullName      string `json:"full_name"`
	Description   string `json:"description"`
	Private       bool   `json:"private"`
	DefaultBranch string `json:"default_branch"`
	UpdatedAt     string `json:"updated_at"`
	StargazersCnt int    `json:"stargazers_count"`
	Owner         struct {
		Login string `json:"login"`
	} `json:"owner"`
}

type ghTreeResponse struct {
	Tree      []ghTreeEntry `json:"tree"`
	Truncated bool          `json:"truncated"`
}

type ghTreeEntry struct {
	Path string `json:"path"`
	Type string `json:"type"`
	Size int    `json:"size"`
	SHA  string `json:"sha"`
}
