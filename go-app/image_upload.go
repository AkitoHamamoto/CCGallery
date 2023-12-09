package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "path/filepath"
    // "strconv"
    "github.com/google/uuid"
)


// 画像の保存先のベースディレクトリ
const baseImagePath = "images"

// レスポンスに含まれる画像のURLを生成する関数
func generateImageUrl(userID, fileName string) string {
    return fmt.Sprintf("/%s/%s/%s", baseImagePath, userID, fileName)
}

// ユーザーIDに基づいてuser_uuidを取得する関数
func getUserUUIDFromDatabase(userID int) (string, error) {
    db, err := OpenDatabase() // 仮想のデータベース接続関数
    if err != nil {
        return "", err
    }
    defer db.Close()

    var userUUID string
    err = db.QueryRow("SELECT user_uuid FROM users WHERE id = ?", userID).Scan(&userUUID)
    if err != nil {
        return "", err
    }

    return userUUID, nil
}

// ユーザープロフィール画像保存（アイコン）
func UploadProfileImageHandler(w http.ResponseWriter, r *http.Request, jwtKey string) {
    EnableCORS(w) // CORSヘッダーの設定

    // プリフライトリクエストにはここで処理を止める
    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }

    // JWTトークンを検証してユーザーIDを取得
    claims, err := ValidateToken(r.Header.Get("Authorization"), jwtKey)
    if err != nil {
        http.Error(w, err.Error(), http.StatusUnauthorized)
        return
    }
    
	// マルチパートフォームデータを解析する
    err = r.ParseMultipartForm(10 << 20) // 10 MBの上限
    if err != nil {
        http.Error(w, "フォームの解析エラー", http.StatusBadRequest)
        return
    }

		// フォームから画像ファイルを取得
    file, header, err := r.FormFile("image") // 'file' と 'header' を宣言
    if err != nil {
        http.Error(w, "ファイルの取得エラー", http.StatusBadRequest)
        return
    }
    defer file.Close()

    // userIDをintからstringに変換
    // userID := strconv.Itoa(claims.ID)

    // userIDを使ってデータベースからuser_uuidを取得
    userUUID, err := getUserUUIDFromDatabase(claims.ID)
    if err != nil {
        http.Error(w, "Failed to retrieve user UUID", http.StatusInternalServerError)
        return
    }

    // "profile"サブディレクトリを含むパスを生成
    profileImagePath := filepath.Join(baseImagePath, userUUID, "profile")

    // ユーザーのプロファイル画像ディレクトリを作成（存在しなければ）
    if err := os.MkdirAll(profileImagePath, 0755); err != nil {
        http.Error(w, "ディレクトリの作成エラー", http.StatusInternalServerError)
        return
    }

    // profileディレクトリ内の既存のファイルを削除
    dirEntries, err := os.ReadDir(profileImagePath)
    if err != nil {
        http.Error(w, "既存のファイルの読み取りエラー", http.StatusInternalServerError)
        return
    }
    for _, entry := range dirEntries {
        os.Remove(filepath.Join(profileImagePath, entry.Name()))
    }

    // 新しいファイル名を生成（UUIDまたは他の方法で一意性を保証する）
    newFileName := uuid.NewString() + filepath.Ext(header.Filename)

    // 新しい画像ファイルを保存
    filePath := filepath.Join(profileImagePath, newFileName)
    dst, err := os.Create(filePath)
    if err != nil {
        http.Error(w, "ファイルの作成エラー", http.StatusInternalServerError)
        return
    }
    defer dst.Close()

    // ファイルをディスクに書き込み
    if _, err := io.Copy(dst, file); err != nil {
        http.Error(w, "ファイルの書き込みエラー", http.StatusInternalServerError)
        return
    }

    // 画像のURLをクライアントに返す
    imageUrl := generateImageUrl(userUUID, "profile/"+newFileName) // URL生成関数を適切に定義する
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"imageUrl": imageUrl})
}


// ポートフォリオの画像保存
func UploadPortfolioImageHandler(w http.ResponseWriter, r *http.Request, jwtKey string) {
    EnableCORS(w) // CORSヘッダーの設定

    if r.Method == "OPTIONS" {
        w.WriteHeader(http.StatusOK)
        return
    }

    // JWTトークンを検証してユーザーIDを取得
    claims, err := ValidateToken(r.Header.Get("Authorization"), jwtKey)
    if err != nil {
        http.Error(w, err.Error(), http.StatusUnauthorized)
        return
    }

    err = r.ParseMultipartForm(10 << 20) // 10 MBの上限
    if err != nil {
        http.Error(w, "フォームの解析エラー", http.StatusBadRequest)
        return
    }

    file, header, err := r.FormFile("image")
    if err != nil {
        http.Error(w, "ファイルの取得エラー", http.StatusBadRequest)
        return
    }
    defer file.Close()

    // userID := strconv.Itoa(claims.ID)

    // userIDを使ってデータベースからuser_uuidを取得
    userUUID, err := getUserUUIDFromDatabase(claims.ID)
    if err != nil {
        http.Error(w, "Failed to retrieve user UUID", http.StatusInternalServerError)
        return
    }

    // "portfolio"サブディレクトリを含むパスを生成
    portfolioImagePath := filepath.Join(baseImagePath, userUUID, "portfolio")

    // ユーザーのポートフォリオ画像ディレクトリを作成（存在しなければ）
    if err := os.MkdirAll(portfolioImagePath, 0755); err != nil {
        http.Error(w, "ディレクトリの作成エラー", http.StatusInternalServerError)
        return
    }

    // 新しいファイル名を生成（UUIDを使用）
    newFileName := uuid.NewString() + filepath.Ext(header.Filename)

    // 新しい画像ファイルを保存
    filePath := filepath.Join(portfolioImagePath, newFileName)
    dst, err := os.Create(filePath)
    if err != nil {
        http.Error(w, "ファイルの作成エラー", http.StatusInternalServerError)
        return
    }
    defer dst.Close()

    if _, err := io.Copy(dst, file); err != nil {
        http.Error(w, "ファイルの書き込みエラー", http.StatusInternalServerError)
        return
    }

    // 画像のURLをクライアントに返す
    imageUrl := generateImageUrl(userUUID, "portfolio/"+newFileName) // URL生成関数を適切に定義する
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"imageUrl": imageUrl})
}
