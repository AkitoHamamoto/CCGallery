package main

import (
    "log"
    "net/http"
    "os"

    "github.com/joho/godotenv"
    _ "github.com/go-sql-driver/mysql"
)


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

    // Database インターフェースの実装を初期化
    db, err := OpenDatabase()
    if err != nil {
        log.Fatalf("Failed to open database: %v", err)
    }
    databaseImplementation := &SQLDatabase{db: db}
    

    // imagesディレクトリを公開する
    fs := http.FileServer(http.Dir("images"))
    http.Handle("/images/", http.StripPrefix("/images/", fs))

    // ログイン認証
    http.HandleFunc("/api/auth", func(w http.ResponseWriter, r *http.Request) {
        AuthHandler(w, r, jwtKey)
    })

    // ログイン
    http.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
        LoginHandler(w, r, jwtKey, databaseImplementation)
    })

    // アカウント登録
    http.HandleFunc("/api/register", func(w http.ResponseWriter, r *http.Request) {
        RegisterHandler(w, r, jwtKey)
    })

    // プロファイル登録と更新のハンドラーを追加(GET/POST/PUT)
    http.HandleFunc("/api/profile", func(w http.ResponseWriter, r *http.Request) {
        ProfileHandler(w, r, jwtKey)
    })

    // ユーザープロフィール取得（userUUID）
    http.HandleFunc("/api/profile/user", func(w http.ResponseWriter, r *http.Request) {
        GetUserProfileByUUID(w, r)
    })

    // ユーザープロフィール取得（protfolioUUID）
    http.HandleFunc("/api/profile/portfolio", func(w http.ResponseWriter, r *http.Request) {
        GetProfileByPortfolioUUID(w, r)
    })


    // 画像アップロード(Profile)
    http.HandleFunc("/api/profile/image", func(w http.ResponseWriter, r *http.Request) {
        UploadProfileImageHandler(w, r, jwtKey)
    })

    // ポートフォリオ関連(GET/POST/PUT/DELETE)
    http.HandleFunc("/api/portfolio", func(w http.ResponseWriter, r *http.Request) {
        PortfolioHandler(w, r, jwtKey)
    })

    // ポートフォリオ詳細取得（portfolioUUID）
    http.HandleFunc("/api/portfolio/portfolio", func(w http.ResponseWriter, r *http.Request) {
        GetPortfolioByPortfolioID(w, r)
    })

    // ポートフォリオ一覧取得(userID)
    http.HandleFunc("/api/portfolios", func(w http.ResponseWriter, r *http.Request) {
        GetUserPortfolios(w, r, jwtKey)
    })

    // ポートフォリオ一覧取得(userUUID)
    http.HandleFunc("/api/portfolios/user", func(w http.ResponseWriter, r *http.Request) {
        GetUserPortfoliosByUUID(w, r)
    })

    // 画像アップロード(Portfolio)
    http.HandleFunc("/api/portfolio/image", func(w http.ResponseWriter, r *http.Request) {
        UploadPortfolioImageHandler(w, r, jwtKey)
    })

    // 技術スタック追加用(Portfolio)
    http.HandleFunc("/api/techstacks", func(w http.ResponseWriter, r *http.Request) {
        GetTechStacksHandler(w, r)
    })
    
    // 限定公開パス検証(Portfolio)
    http.HandleFunc("/api/validate-uuid", func(w http.ResponseWriter, r *http.Request) {
        ValidateEncryptedUUID(w, r)
    })

    // 限定公開パス発行(Portfolio)
    http.HandleFunc("/api/generate-pass", func(w http.ResponseWriter, r *http.Request) {
        GenerateEncryptedPass(w, r)
    })

    log.Println("Server is running on port 8080...")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
