package main

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    "os"

    "github.com/golang/mock/gomock"
    "golang.org/x/crypto/bcrypt"
)

// モックデータベースとJWT生成関数の作成
func setupMock(t *testing.T) (*MockDatabase, string) {
    ctrl := gomock.NewController(t)
    db := NewMockDatabase(ctrl)

    // 環境変数のセットアップ（テスト用のJWT鍵など）
    os.Setenv("JWT_SECRET_KEY", "test_jwt_key")
    jwtKey := os.Getenv("JWT_SECRET_KEY")

    return db, jwtKey
}

// 正常にログインできるテスト用アカウント情報
func setupValidLoginCredentials() (Credentials, User) {
    // 有効なログイン情報
    validCreds := Credentials{Email: "test2@example.com", Password: "newpassword"}
    hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(validCreds.Password), bcrypt.DefaultCost)
    validUser := User{ID: 2, Email: validCreds.Email, Password: string(hashedPassword)}

    return validCreds, validUser
}


func TestLoginHandlerWithValidCredentials(t *testing.T) {
    db, jwtKey := setupMock(t)

    // 有効なログイン情報
    validCreds, validUser := setupValidLoginCredentials()

    // モックデータベースの期待値を設定
    db.EXPECT().GetUserByEmail(validCreds.Email).Return(validUser, nil)

    // HTTPリクエストとレスポンスのセットアップ
    body, _ := json.Marshal(validCreds)
    req := httptest.NewRequest("POST", "/api/login", bytes.NewReader(body))
    w := httptest.NewRecorder()

    // ハンドラーの実行
    LoginHandler(w, req, jwtKey, db)

    // レスポンスの検証
    res := w.Result()
    defer res.Body.Close()

    // ステータスコードとレスポンスボディの検証
    if res.StatusCode != http.StatusOK {
        t.Errorf("Expected status OK, got %v", res.StatusCode)
    }

    // レスポンスの検証
    verifyResponse(t, w, http.StatusOK, "Login successful", true)
}


func TestLoginHandlerWithInvalidCredentials(t *testing.T) {
    db, jwtKey := setupMock(t)

    // 無効なログイン情報
    invalidCreds := Credentials{Email: "failtest@example.com", Password: "newpassword"}

    // モックデータベースの期待値を設定（ユーザーが見つからない）
    db.EXPECT().GetUserByEmail(invalidCreds.Email).Return(User{}, sql.ErrNoRows)

    // HTTPリクエストとレスポンスのセットアップ
    body, _ := json.Marshal(invalidCreds)
    req := httptest.NewRequest("POST", "/api/login", bytes.NewReader(body))
    w := httptest.NewRecorder()

    // ハンドラーの実行
    LoginHandler(w, req, jwtKey, db)

    // レスポンスの検証
    res := w.Result()
    defer res.Body.Close()

    // ステータスコードの検証（ログイン失敗）
    if res.StatusCode != http.StatusUnauthorized {
        t.Errorf("Expected status Unauthorized, got %v", res.StatusCode)
    }

    // レスポンスの検証
    verifyResponse(t, w, http.StatusUnauthorized, "User not found", false)
}
