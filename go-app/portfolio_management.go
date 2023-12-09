package main

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "net/http"
    "strings"
    // "time"
    // "os"
    "github.com/google/uuid"
    // "log"
)

type Portfolio struct {
	Title         string `json:"title"`
	Subtitle      string `json:"subtitle,omitempty"`
	Thumbnail     string `json:"thumbnail,omitempty"`
	GithubRepoURL string `json:"github_repo_url,omitempty"`
	Content       string `json:"content"`
	Tags          string `json:"tags,omitempty"`
	Status        string `json:"status"`
	UpdatedAt     string `json:"updated_at"`
    PortfolioUUID string `json:"portfolio_uuid,omitempty"`
}



func PortfolioHandler(w http.ResponseWriter, r *http.Request, jwtKey string) {
    EnableCORS(w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

    // AuthorizationヘッダーからJWTトークンを検証
    claims, err := ValidateToken(r.Header.Get("Authorization"), jwtKey)
    if err != nil {
        http.Error(w, err.Error(), http.StatusUnauthorized)
        return
    }

    db, err := OpenDatabase()
    if err != nil {
        http.Error(w, "Database connection error", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    switch r.Method {
    case http.MethodGet:
        portfolioUUID := r.URL.Query().Get("id")
        if portfolioUUID == "" {
            http.Error(w, "Portfolio UUID is required", http.StatusBadRequest)
            return
        }

        sqlStmt := `SELECT title, subtitle, thumbnail, github_repo_url, content, tags, status, updated_at FROM Portfolio WHERE portfolio_uuid=? AND user_id=?`
        var portfolio Portfolio
        err = db.QueryRow(sqlStmt, portfolioUUID, claims.ID).Scan(&portfolio.Title, &portfolio.Subtitle, &portfolio.Thumbnail, &portfolio.GithubRepoURL, &portfolio.Content, &portfolio.Tags, &portfolio.Status, &portfolio.UpdatedAt)
        if err != nil {
            // レコードが見つからない場合はNotFoundエラーを返す
            if err == sql.ErrNoRows {
                http.Error(w, "No portfolio found with the provided UUID for the user", http.StatusNotFound)
            } else {
                http.Error(w, "Database query failed", http.StatusInternalServerError)
            }
            return
        }

        // 成功レスポンスを返送
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(portfolio)

    case http.MethodPost:
        var portfolio Portfolio
        err = json.NewDecoder(r.Body).Decode(&portfolio)
        if err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        defer r.Body.Close()

        // 新しいUUIDを生成
        portfolioUUID := uuid.NewString()

        // データベースに新しいポートフォリオを挿入するSQL文を準備
        sqlStmt := `INSERT INTO Portfolio (user_id, title, subtitle, thumbnail, github_repo_url, content, tags, status, portfolio_uuid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        _, err = db.Exec(sqlStmt, claims.ID, portfolio.Title, portfolio.Subtitle, portfolio.Thumbnail, portfolio.GithubRepoURL, portfolio.Content, portfolio.Tags, portfolio.Status, portfolioUUID)
        if err != nil {
            http.Error(w, "Database execution failed", http.StatusInternalServerError)
            return
        }

        // 成功レスポンスを返送
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(map[string]interface{}{
            "portfolio_uuid": portfolioUUID, // 新しく生成されたUUIDをレスポンスに含める
        })

    case http.MethodPut:
        // UUIDをクエリパラメータから取得
        portfolioUUID := r.URL.Query().Get("id")
        if portfolioUUID == "" {
            http.Error(w, "Portfolio UUID is required", http.StatusBadRequest)
            return
        }

        // リクエストボディからポートフォリオデータを読み取り
        var portfolio Portfolio
        err = json.NewDecoder(r.Body).Decode(&portfolio)
        if err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        defer r.Body.Close()

        // データベースを更新
        sqlStmt := `UPDATE Portfolio SET title=?, subtitle=?, thumbnail=?, github_repo_url=?, content=?, tags=?, status=? WHERE portfolio_uuid=? AND user_id=?`
        res, err := db.Exec(sqlStmt, portfolio.Title, portfolio.Subtitle, portfolio.Thumbnail, portfolio.GithubRepoURL, portfolio.Content, portfolio.Tags, portfolio.Status, portfolioUUID, claims.ID)
        if err != nil {
            http.Error(w, "Database execution failed", http.StatusInternalServerError)
            return
        }

        // 影響を受けた行数を確認
        rowsAffected, err := res.RowsAffected()
        if err != nil {
            http.Error(w, "Error checking affected rows", http.StatusInternalServerError)
            return
        }

        if rowsAffected == 0 {
            http.Error(w, "No portfolio found with the provided UUID owned by the user", http.StatusNotFound)
            return
        }

        // 成功したらクライアントに結果を返す
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{"result": "success"})


    case http.MethodDelete:
        portfolioUUID := r.URL.Query().Get("id")
        if portfolioUUID == "" {
            http.Error(w, "Portfolio UUID is required", http.StatusBadRequest)
            return
        }

        sqlStmt := `DELETE FROM Portfolio WHERE portfolio_uuid=? AND user_id=?`
        res, err := db.Exec(sqlStmt, portfolioUUID, claims.ID)
        if err != nil {
            http.Error(w, "Database execution failed", http.StatusInternalServerError)
            return
        }

        // 影響を受けた行の数をチェック
        rowsAffected, err := res.RowsAffected()
        if err != nil {
            http.Error(w, "Error checking affected rows", http.StatusInternalServerError)
            return
        }

        if rowsAffected == 0 {
            http.Error(w, "No portfolio found with the provided UUID owned by the user", http.StatusNotFound)
            return
        }

        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{"result": "success"})

    default:
        http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
    }
}


// ポートフォリオ詳細取得（ポートフォリオID）
func GetPortfolioByPortfolioID(w http.ResponseWriter, r *http.Request) {
    EnableCORS(w)

    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }

    if r.Method != http.MethodGet {
        http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        return
    }

    db, err := OpenDatabase()
    if err != nil {
        http.Error(w, "Database connection error", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    portfolioUUID := r.URL.Query().Get("id")
    if portfolioUUID == "" {
        http.Error(w, "Portfolio UUID is required", http.StatusBadRequest)
        return
    }

    sqlStmt := `SELECT title, subtitle, thumbnail, github_repo_url, content, tags, status, updated_at FROM Portfolio WHERE portfolio_uuid=? AND status != '0'`
    var portfolio Portfolio
    err = db.QueryRow(sqlStmt, portfolioUUID).Scan(&portfolio.Title, &portfolio.Subtitle, &portfolio.Thumbnail, &portfolio.GithubRepoURL, &portfolio.Content, &portfolio.Tags, &portfolio.Status, &portfolio.UpdatedAt)
    if err != nil {
        if err == sql.ErrNoRows {
            http.Error(w, "No portfolio found with the provided UUID or the portfolio is not published", http.StatusNotFound)
        } else {
            http.Error(w, "Database query failed", http.StatusInternalServerError)
        }
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(portfolio)
}


// GetUserPortfolios retrieves all portfolios for a given user ID.
func GetUserPortfolios(w http.ResponseWriter, r *http.Request, jwtKey string) {
    EnableCORS(w)

    // OPTIONSリクエストの処理を追加
    if r.Method == http.MethodOptions {
        w.WriteHeader(http.StatusOK)
        return
    }

    // AuthorizationヘッダーからJWTトークンを検証
    claims, err := ValidateToken(r.Header.Get("Authorization"), jwtKey)
    if err != nil {
        http.Error(w, err.Error(), http.StatusUnauthorized)
        return
    }

    db, err := OpenDatabase()
    if err != nil {
        http.Error(w, "Database connection error", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // userIDをJWTクレームから取得し、該当するすべてのポートフォリオを取得
    sqlStmt := `SELECT portfolio_uuid, title, subtitle, thumbnail, github_repo_url, tags, status FROM Portfolio WHERE user_id=?`
    rows, err := db.Query(sqlStmt, claims.ID)
    if err != nil {
        http.Error(w, "Database query failed", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var portfolios []map[string]interface{}
    for rows.Next() {
        var p Portfolio
        err := rows.Scan(&p.PortfolioUUID, &p.Title, &p.Subtitle, &p.Thumbnail, &p.GithubRepoURL, &p.Tags, &p.Status)
        if err != nil {
            http.Error(w, "Failed to scan row", http.StatusInternalServerError)
            return
        }

        portfolios = append(portfolios, map[string]interface{}{
            "portfolio_uuid": p.PortfolioUUID,
            "title":          p.Title,
            "subtitle":       p.Subtitle,
            "thumbnail":      p.Thumbnail,
            "github_repo_url": p.GithubRepoURL,
            // "content":        p.Content,
            "tags":           p.Tags,
            "status":         p.Status,
        })
    }

    if err := rows.Err(); err != nil {
        http.Error(w, "Failed during rows iteration", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(portfolios)
}

// userid（UUID）からポートフォリオを取得
func GetUserPortfoliosByUUID(w http.ResponseWriter, r *http.Request) {
    EnableCORS(w)

    if r.Method == http.MethodOptions {
        w.WriteHeader(http.StatusOK)
        return
    }

    if r.Method != http.MethodGet {
        http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        return
    }

    userUUID := r.URL.Query().Get("id")
    if userUUID == "" {
        http.Error(w, "User UUID not provided", http.StatusBadRequest)
        return
    }

    db, err := OpenDatabase()
    if err != nil {
        http.Error(w, "Database connection error", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // user_uuid を使って user_id を取得する
    var userID int
    err = db.QueryRow(`SELECT id FROM users WHERE user_uuid = ?`, userUUID).Scan(&userID)
    if err != nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    // userID を使ってポートフォリオ情報を取得する
    rows, err := db.Query(`SELECT portfolio_uuid, title, subtitle, thumbnail, github_repo_url, tags, status FROM Portfolio WHERE user_id = ?`, userID)
    if err != nil {
        http.Error(w, "Database query failed", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var portfolios []map[string]interface{}
    for rows.Next() {
        var portfolio Portfolio
        err := rows.Scan(&portfolio.PortfolioUUID, &portfolio.Title, &portfolio.Subtitle, &portfolio.Thumbnail, &portfolio.GithubRepoURL, &portfolio.Tags, &portfolio.Status)
        if err != nil {
            http.Error(w, "Failed to scan row", http.StatusInternalServerError)
            return
        }
        portfolios = append(portfolios, map[string]interface{}{
            "portfolio_uuid":   portfolio.PortfolioUUID,
            "title":            portfolio.Title,
            "subtitle":         portfolio.Subtitle,
            "thumbnail":        portfolio.Thumbnail,
            "github_repo_url":  portfolio.GithubRepoURL,
            "tags":             portfolio.Tags,
            "status":           portfolio.Status,
        })
    }

    if err := rows.Err(); err != nil {
        http.Error(w, "Failed during rows iteration", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(portfolios)
}



// TechStacks テーブルからタグを検索するためのハンドラー
func GetTechStacksHandler(w http.ResponseWriter, r *http.Request) {
    EnableCORS(w)

    if r.Method != http.MethodGet {
        http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        return
    }

    // データベース接続
    db, err := OpenDatabase()
    if err != nil {
        http.Error(w, "Database connection error", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // クエリパラメータ 'search' が提供されているか確認
    query, present := r.URL.Query()["search"]


    var rows *sql.Rows
    if present && query[0] != "" {
        // LIKE演算子を使用してnameカラムで検索
        likeQuery := fmt.Sprintf("%s%%", strings.ToUpper(query[0]))
        rows, err = db.Query("SELECT name FROM TechStacks WHERE name LIKE ?", likeQuery)
    } else {
        // クエリパラメータがない場合、すべての技術スタックを取得
        rows, err = db.Query("SELECT name FROM TechStacks")
    }

    if err != nil {
        http.Error(w, "Database query error", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var techStacks []string
    for rows.Next() {
        var name string
        if err := rows.Scan(&name); err != nil {
            http.Error(w, "Database scan error", http.StatusInternalServerError)
            return
        }
        techStacks = append(techStacks, name)
    }

    // JSONとしてクライアントに結果を返す
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(techStacks)
}