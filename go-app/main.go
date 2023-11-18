package main

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"
    "os"
    "crypto/rand"
    "encoding/base64"

    "golang.org/x/crypto/bcrypt"
    "github.com/dgrijalva/jwt-go"
    "github.com/joho/godotenv"
    "time"
    _ "github.com/go-sql-driver/mysql"
)


// ユーザー認証情報
type Credentials struct {
    Password string `json:"password"`
    Email    string `json:"email"`
}

// ClaimsはJWTのペイロードに格納される情報です。
type Claims struct {
    ID    int    `json:"id"`
    Email string `json:"email"`
    jwt.StandardClaims
}

type ResponseData struct {
    Message string `json:"message"`
    Token   string `json:"token,omitempty"` // JWT トークン用のフィールドを追加
}

func openDatabase() (*sql.DB, error) {
    // 環境変数からデータベース接続情報を取得
    dbUser := os.Getenv("DB_USER")
    dbPass := os.Getenv("DB_PASS")
    dbHost := os.Getenv("DB_HOST")
    dbPort := os.Getenv("DB_PORT")
    dbName := os.Getenv("DB_NAME")

    // データソース名（DSN）を組み立てる
    dsn := dbUser + ":" + dbPass + "@tcp(" + dbHost + ":" + dbPort + ")/" + dbName
    db, err := sql.Open("mysql", dsn)
    if err != nil {
        return nil, err
    }
    return db, nil
}

func enableCORS(w *http.ResponseWriter) {
    (*w).Header().Set("Access-Control-Allow-Origin", "http://localhost:3000") // Reactアプリのオリジンを指定
    (*w).Header().Set("Access-Control-Allow-Credentials", "true") // クレデンシャルを許可
    (*w).Header().Set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-TOKEN") // X-CSRF-TOKENを追加
    (*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
}

// GenerateJWTは新しいJWTを生成します。
func GenerateJWT(id int, email string, jwtKey string) (string, error) {
    // expirationTime := time.Now().Add(1 * time.Hour) 
    expirationTime := time.Now().Add(time.Hour * 1) // 有効期限を1時間後に設定

    claims := &Claims{
        ID:    id,
        Email: email,
        StandardClaims: jwt.StandardClaims{
            ExpiresAt: expirationTime.Unix(),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString([]byte(jwtKey))

    return tokenString, err
}

func generateCSRFToken() (string, error) {
    b := make([]byte, 32)
    _, err := rand.Read(b)
    if err != nil {
        return "", err
    }
    return base64.StdEncoding.EncodeToString(b), nil
}

func authHandler(w http.ResponseWriter, r *http.Request, jwtKey string) {
    // CORSプリフライトリクエストへの対応
    if r.Method == "OPTIONS" {
        enableCORS(&w)
        w.WriteHeader(http.StatusOK)
        return
    }

    enableCORS(&w) // 通常のリクエストに対するCORSヘッダーの設定


    // クライアントのリクエストからCookieを取得
    cookie, err := r.Cookie("token")
    if err != nil {
        if err == http.ErrNoCookie {
            // Cookieがセットされていない場合は、未認証として扱う
            log.Println("Auth Error: No auth token provided")
            http.Error(w, "No auth token provided", http.StatusUnauthorized)
            return
        }
        log.Printf("Auth Error: Error retrieving token from cookie: %v\n", err)
        http.Error(w, "Invalid token", http.StatusBadRequest)
        return
    }

    // Cookieからトークンを取得
    tokenString := cookie.Value

    // JWTトークンの検証
    claims := &Claims{} // カスタムクレーム構造体を使用
    token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
        return []byte(jwtKey), nil
    })

    if err != nil {
        if err == jwt.ErrSignatureInvalid {
            log.Println("Auth Error: Token signature is invalid")
            w.WriteHeader(http.StatusUnauthorized)
            return
        }
        log.Printf("Auth Error: Error parsing token: %v\n", err)
        w.WriteHeader(http.StatusBadRequest)
        return
    }

    if !token.Valid {
        log.Println("Auth Error: Token is not valid")
        w.WriteHeader(http.StatusUnauthorized)
        return
    }

    // トークンが有効であれば、認証成功のレスポンスを返す
    log.Println("Auth Success: Token is valid")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(claims)
}

func loginHandler(w http.ResponseWriter, r *http.Request, jwtKey string) {
    if r.Method == "OPTIONS" {
        enableCORS(&w)
        w.WriteHeader(http.StatusOK)
        return
    }
    
    // POSTリクエストのみ許可
    if r.Method != "POST" {
        http.Error(w, "Only POST requests are allowed", http.StatusMethodNotAllowed)
        return
    }

    enableCORS(&w) // 他のHTTPメソッドでもCORSを有効化


    // 認証情報を取得
    var creds Credentials
    err := json.NewDecoder(r.Body).Decode(&creds)
    if err != nil {
        http.Error(w, "Invalid user credentials", http.StatusBadRequest)
        return
    }

    // データベース接続を開く
    db, err := openDatabase()
    if err != nil {
        http.Error(w, "Database connection error", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // データベースからユーザーを検索
    var storedCreds Credentials
    var userID int // ユーザーIDを格納するための変数
    err = db.QueryRow("SELECT id, password FROM users WHERE email = ?", creds.Email).Scan(&userID, &storedCreds.Password)
    if err != nil {
        if err == sql.ErrNoRows {
            http.Error(w, "User not found", http.StatusUnauthorized)
        } else {
            http.Error(w, "Database query error", http.StatusInternalServerError)
        }
        return
    }

    // パスワードが一致するか検証
    if err := bcrypt.CompareHashAndPassword([]byte(storedCreds.Password), []byte(creds.Password)); err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // JWTトークンの生成
    tokenString, err := GenerateJWT(userID, creds.Email, jwtKey)
    if err != nil {
        http.Error(w, "Error generating JWT", http.StatusInternalServerError)
        return
    }

    // expirationTimeの定義を追加
    expirationTime := time.Now().Add(time.Hour * 1)

    // セキュアなCookieにJWTトークンをセットする
    http.SetCookie(w, &http.Cookie{
        Name:     "token",
        Value:    tokenString,
        Expires:  expirationTime,
        HttpOnly: true,
        Secure:   true,
        Path:     "/",
        SameSite: http.SameSiteStrictMode,
    })

    // CSRFトークンの生成とエラーチェックを追加
    csrfToken, err := generateCSRFToken()
    if err != nil {
        http.Error(w, "Failed to generate CSRF token", http.StatusInternalServerError)
        return
    }
    w.Header().Set("X-CSRF-TOKEN", csrfToken)


    // ログイン成功のレスポンスにJWTを含める
    json.NewEncoder(w).Encode(ResponseData{
        Message: "Login successful",
        Token:   tokenString,
    })
}

func registerHandler(w http.ResponseWriter, r *http.Request, jwtKey string) {
    if r.Method == "OPTIONS" {
        enableCORS(&w)
        w.WriteHeader(http.StatusOK)
        return
    }

    // POSTリクエストのみ許可
    if r.Method != "POST" {
        http.Error(w, "Only POST requests are allowed", http.StatusMethodNotAllowed)
        return
    }

    enableCORS(&w) // CORSを有効化

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
    db, err := openDatabase() // データベース接続を開く
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
    result, err := db.Exec("INSERT INTO users(email, password) VALUES(?, ?)", creds.Email, hashedPassword)
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

    // expirationTimeの定義
    expirationTime := time.Now().Add(time.Hour * 1)

    // セキュアなCookieにJWTトークンをセットする
    http.SetCookie(w, &http.Cookie{
        Name:     "token",
        Value:    tokenString,
        Expires:  expirationTime,
        HttpOnly: true,
        Secure:   true, // HTTPSを使用している場合のみtrueにする
        Path:     "/",
        SameSite: http.SameSiteStrictMode,
    })

    // CSRFトークンの生成
    csrfToken, err := generateCSRFToken()
    if err != nil {
        http.Error(w, "Failed to generate CSRF token", http.StatusInternalServerError)
        return
    }
    w.Header().Set("X-CSRF-TOKEN", csrfToken)

    // JSONレスポンスを返す
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(ResponseData{
        Message: "Account created successfully",
        Token:   tokenString,
    })
}


func main() {
    // .envファイルから環境変数を読み込む
    err := godotenv.Load("../.env")
    if err != nil {
        log.Fatal("Error loading .env file")
    }

    // 環境変数からJWTの秘密鍵を取得
    jwtKey := os.Getenv("JWT_SECRET_KEY")
    if jwtKey == "" {
        log.Fatal("JWT_SECRET_KEY must be set in the environment variables")
    }

    // ログイン認証
    http.HandleFunc("/api/auth", func(w http.ResponseWriter, r *http.Request) {
        authHandler(w, r, jwtKey)
    })

    // ログイン
    http.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
        loginHandler(w, r, jwtKey)
    })

    // アカウント登録
    http.HandleFunc("/api/register", func(w http.ResponseWriter, r *http.Request) {
        registerHandler(w, r, jwtKey)
    })


    log.Println("Server is running on port 8080...")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
