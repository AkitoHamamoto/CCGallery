package main

import (
    // "database/sql"
    "encoding/json"
    "net/http"
)

type Profile struct {
	ProfileImage string `json:"profile_image,omitempty"`
	FullName     string `json:"full_name,omitempty"`
	Username     string `json:"username"`
	ContactEmail string `json:"contact_email,omitempty"`
	Bio          string `json:"bio,omitempty"`
	TwitterURL   string `json:"twitter_url,omitempty"`
	GithubURL    string `json:"github_url,omitempty"`
	InstagramURL string `json:"instagram_url,omitempty"`
	YoutubeURL   string `json:"youtube_url,omitempty"`
	TiktokURL    string `json:"tiktok_url,omitempty"`
}

func ProfileHandler(w http.ResponseWriter, r *http.Request, jwtKey string) {
	EnableCORS(w) // 通常のリクエストに対するCORSヘッダーの設定
	
	// CORSプリフライトリクエストへの対応
	if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
	}

	switch r.Method {
	case http.MethodGet:
    // AuthorizationヘッダーからJWTトークンを検証
    claims, err := ValidateToken(r.Header.Get("Authorization"), jwtKey)
    if err != nil {
        http.Error(w, err.Error(), http.StatusUnauthorized)
        return
    }

    // データベース接続を開く
    db, err := OpenDatabase()
    if err != nil {
        http.Error(w, "Database connection error", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // SQLステートメントを準備
    sqlStmt := `SELECT profile_image, full_name, username, contact_email, bio, twitter_url, github_url, instagram_url, youtube_url, tiktok_url FROM Profile WHERE user_id=?`
    stmt, err := db.Prepare(sqlStmt)
    if err != nil {
        http.Error(w, "Database prepare statement failed", http.StatusInternalServerError)
        return
    }
    defer stmt.Close()

    // SQLステートメントを実行
    var profile Profile
    err = stmt.QueryRow(claims.ID).Scan(&profile.ProfileImage, &profile.FullName, &profile.Username, &profile.ContactEmail, &profile.Bio, &profile.TwitterURL, &profile.GithubURL, &profile.InstagramURL, &profile.YoutubeURL, &profile.TiktokURL)
    if err != nil {
        http.Error(w, "Database query failed", http.StatusInternalServerError)
        return
    }

    // プロファイルデータをJSON形式でクライアントに送信
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(profile)

	case http.MethodPost, http.MethodPut:
		// AuthorizationヘッダーからJWTトークンを検証
		claims, err := ValidateToken(r.Header.Get("Authorization"), jwtKey)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		var profile Profile
		err = json.NewDecoder(r.Body).Decode(&profile)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// データベース接続を開く
		db, err := OpenDatabase()
		if err != nil {
			http.Error(w, "Database connection error", http.StatusInternalServerError)
			return
		}
		defer db.Close()

		// SQLステートメントを準備
		var sqlStmt string
		if r.Method == http.MethodPost {
			sqlStmt = `INSERT INTO Profile (user_id, profile_image, full_name, username, contact_email, bio, twitter_url, github_url, instagram_url, youtube_url, tiktok_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		} else {
			sqlStmt = `UPDATE Profile SET profile_image=?, full_name=?, username=?, contact_email=?, bio=?, twitter_url=?, github_url=?, instagram_url=?, youtube_url=?, tiktok_url=? WHERE user_id=?`
		}

		stmt, err := db.Prepare(sqlStmt)
		if err != nil {
			http.Error(w, "Database prepare statement failed", http.StatusInternalServerError)
			return
		}
		defer stmt.Close()

		// SQLステートメントを実行
		if r.Method == http.MethodPost {
			_, err = stmt.Exec(claims.ID, profile.ProfileImage, profile.FullName, profile.Username, profile.ContactEmail, profile.Bio, profile.TwitterURL, profile.GithubURL, profile.InstagramURL, profile.YoutubeURL, profile.TiktokURL)
		} else {
			_, err = stmt.Exec(profile.ProfileImage, profile.FullName, profile.Username, profile.ContactEmail, profile.Bio, profile.TwitterURL, profile.GithubURL, profile.InstagramURL, profile.YoutubeURL, profile.TiktokURL, claims.ID)
		}
		if err != nil {
			http.Error(w, "Database execution failed", http.StatusInternalServerError)
			return
		}

		// 成功のレスポンスを送信
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"result": "success"})

	default:
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
	}
}

// user_uuidからプロフィールを取得
func GetUserProfileByUUID(w http.ResponseWriter, r *http.Request) {
    EnableCORS(w) // CORSヘッダーの設定

    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }

    if r.Method != http.MethodGet {
        http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        return
    }

    // クエリパラメータからuser_uuidを取得
    queryValues := r.URL.Query()
    userUUID := queryValues.Get("id")
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

    // user_uuidを使用してuser_idを取得
    var userID int
    err = db.QueryRow(`SELECT id FROM users WHERE user_uuid = ?`, userUUID).Scan(&userID)
    if err != nil {
        http.Error(w, "Failed to get user ID from user UUID", http.StatusInternalServerError)
        return
    }

    // user_idを使用してプロファイルを取得
    var profile Profile
    err = db.QueryRow(`SELECT profile_image, full_name, username, contact_email, bio, twitter_url, github_url, instagram_url, youtube_url, tiktok_url FROM Profile WHERE user_id = ?`, userID).Scan(
        &profile.ProfileImage, &profile.FullName, &profile.Username, &profile.ContactEmail,
        &profile.Bio, &profile.TwitterURL, &profile.GithubURL, &profile.InstagramURL,
        &profile.YoutubeURL, &profile.TiktokURL,
    )
    if err != nil {
        http.Error(w, "Failed to get profile data", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(profile)
}


func GetProfileByPortfolioUUID(w http.ResponseWriter, r *http.Request) {
    EnableCORS(w)

    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }

    if r.Method != http.MethodGet {
        http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        return
    }

    // クエリパラメータからportfolio_uuidを取得
    queryValues := r.URL.Query()
    portfolioUUID := queryValues.Get("id")
    if portfolioUUID == "" {
        http.Error(w, "Portfolio UUID not provided", http.StatusBadRequest)
        return
    }

    db, err := OpenDatabase()
    if err != nil {
        http.Error(w, "Database connection error", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // portfolio_uuidを使用してuser_idを取得
    var userID int
    err = db.QueryRow(`SELECT user_id FROM Portfolio WHERE portfolio_uuid = ?`, portfolioUUID).Scan(&userID)
    if err != nil {
        http.Error(w, "Failed to get user ID from portfolio UUID", http.StatusInternalServerError)
        return
    }

    // user_idを使用してプロファイルを取得
    var profile Profile
    err = db.QueryRow(`SELECT profile_image, full_name, username, contact_email, bio, twitter_url, github_url, instagram_url, youtube_url, tiktok_url FROM Profile WHERE user_id = ?`, userID).Scan(
        &profile.ProfileImage, &profile.FullName, &profile.Username, &profile.ContactEmail,
        &profile.Bio, &profile.TwitterURL, &profile.GithubURL, &profile.InstagramURL,
        &profile.YoutubeURL, &profile.TiktokURL,
    )
    if err != nil {
        http.Error(w, "Failed to get profile data", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(profile)
}
