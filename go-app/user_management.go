package main

import (
    "database/sql"
    "encoding/json"
    "golang.org/x/crypto/bcrypt"
    "net/http"
    "github.com/google/uuid"
)

type Credentials struct {
    Password string `json:"password"`
    Email    string `json:"email"`
}

type ResponseData struct {
    Message string `json:"message"`
    Token   string `json:"token,omitempty"` // JWT トークン用のフィールドを追加
}


func LoginHandler(w http.ResponseWriter, r *http.Request, jwtKey string, db Database) {
    if r.Method == "OPTIONS" {
        EnableCORS(w)
        w.WriteHeader(http.StatusOK)
        return
    }
    
    // POSTリクエストのみ許可
    if r.Method != "POST" {
        http.Error(w, "Only POST requests are allowed", http.StatusMethodNotAllowed)
        return
    }

    EnableCORS(w) // 他のHTTPメソッドでもCORSを有効化


    // 認証情報を取得
    var creds Credentials
    err := json.NewDecoder(r.Body).Decode(&creds)
    if err != nil {
        http.Error(w, "Invalid user credentials", http.StatusBadRequest)
        return
    }

    // データベース接続を開く
    // db, err := OpenDatabase()
    // if err != nil {
    //     http.Error(w, "Database connection error", http.StatusInternalServerError)
    //     return
    // }
    // defer db.Close()

    // データベースからユーザーを検索
    // var storedCreds Credentials
    // var userID int // ユーザーIDを格納するための変数
    // err = db.QueryRow("SELECT id, password FROM users WHERE email = ?", creds.Email).Scan(&userID, &storedCreds.Password)
    // if err != nil {
    //     if err == sql.ErrNoRows {
    //         http.Error(w, "User not found", http.StatusUnauthorized)
    //     } else {
    //         http.Error(w, "Database query error", http.StatusInternalServerError)
    //     }
    //     return
    // }

    // // パスワードが一致するか検証
    // if err := bcrypt.CompareHashAndPassword([]byte(storedCreds.Password), []byte(creds.Password)); err != nil {
    //     http.Error(w, "Unauthorized", http.StatusUnauthorized)
    //     return
    // }

    // データベースからユーザーを検索
    storedUser, err := db.GetUserByEmail(creds.Email)
    if err != nil {
        if err == sql.ErrNoRows {
            http.Error(w, "User not found", http.StatusUnauthorized)
        } else {
            http.Error(w, "Database query error", http.StatusInternalServerError)
        }
        return
    }

    // パスワードが一致するか検証
    if err := bcrypt.CompareHashAndPassword([]byte(storedUser.Password), []byte(creds.Password)); err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // JWTトークンの生成
    tokenString, err := GenerateJWT(storedUser.ID, creds.Email, jwtKey)
    if err != nil {
        http.Error(w, "Error generating JWT", http.StatusInternalServerError)
        return
    }

    // ログイン成功のレスポンスにJWTを含める
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(ResponseData{
        Message: "Login successful",
        Token:   tokenString,
    })
}

func RegisterHandler(w http.ResponseWriter, r *http.Request, jwtKey string) {
    if r.Method == "OPTIONS" {
        EnableCORS(w)
        w.WriteHeader(http.StatusOK)
        return
    }

    // POSTリクエストのみ許可
    if r.Method != "POST" {
        http.Error(w, "Only POST requests are allowed", http.StatusMethodNotAllowed)
        return
    }

    EnableCORS(w) // CORSを有効化

    // ユーザー情報を取得
    var creds Credentials
    err := json.NewDecoder(r.Body).Decode(&creds)
    if err != nil {
        http.Error(w, "Invalid request payload", http.StatusBadRequest)
        return
    }

    // パスワードのハッシュ化
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
    if err != nil {
        http.Error(w, "Error while hashing password", http.StatusInternalServerError)
        return
    }

    // データベースにユーザー情報を保存
    db, err := OpenDatabase() // データベース接続を開く
    if err != nil {
        http.Error(w, "Database connection error", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // メールアドレスの重複チェック
    err = db.QueryRow("SELECT id FROM users WHERE email = ?", creds.Email).Scan(new(int))
    if err != sql.ErrNoRows {
        // メールアドレスが既に存在する場合は、409 Conflictエラーを返す
        http.Error(w, "Email address already in use", http.StatusConflict)
        return
    }

    // トランザクションの開始
    tx, err := db.Begin()
    if err != nil {
        http.Error(w, "Database transaction error", http.StatusInternalServerError)
        return
    }

    // トランザクションを安全に閉じる
    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p) // re-throw panic after Rollback
        } else if err != nil {
            tx.Rollback() // err is non-nil; don't change it
        }
    }()

    // ユーザー情報のインサートクエリを実行
    userUUID := uuid.NewString() // UUIDを生成
    result, err := db.Exec("INSERT INTO users(email, password, user_uuid) VALUES(?, ?, ?)", creds.Email, hashedPassword, userUUID)
    if err != nil {
        http.Error(w, "Failed to create account", http.StatusInternalServerError)
        return
    }

    // INSERTされたレコードのIDを取得
    userID, err := result.LastInsertId()
    if err != nil {
        http.Error(w, "Failed to retrieve user ID", http.StatusInternalServerError)
        return
    }

    // トランザクションをコミット
    if err = tx.Commit(); err != nil {
        http.Error(w, "Database transaction commit error", http.StatusInternalServerError)
        return
    }

    // JWTの生成(id, email)
    tokenString, err := GenerateJWT(int(userID), creds.Email, jwtKey)
    if err != nil {
        http.Error(w, "Error generating JWT", http.StatusInternalServerError)
        return
    }

    // JSONレスポンスを返す
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(ResponseData{
        Message: "Account created successfully",
        Token:   tokenString,
    })
}