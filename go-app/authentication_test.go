package main

import (
    "net/http"
    "net/http/httptest"
    "testing"
		"github.com/dgrijalva/jwt-go"
		"time"
)

func TestEnableCORS(t *testing.T) {
    // レスポンスライターをモック
    res := httptest.NewRecorder()

    // EnableCORS関数を実行
    EnableCORS(res)

    // レスポンスヘッダーを取得
    headers := res.Header()

    // 各ヘッダーの検証
    if headers.Get("Access-Control-Allow-Origin") != "http://localhost:3000" {
        t.Errorf("Expected 'Access-Control-Allow-Origin' header to be 'http://localhost:3000', got '%s'", headers.Get("Access-Control-Allow-Origin"))
    }

    if headers.Get("Access-Control-Allow-Credentials") != "true" {
        t.Errorf("Expected 'Access-Control-Allow-Credentials' to be 'true', got '%s'", headers.Get("Access-Control-Allow-Credentials"))
    }

    // 他のヘッダーも同様に検証...
}

func TestGenerateJWT(t *testing.T) {
    // テスト用のユーザーIDとメールアドレス
    userID := 123
    userEmail := "test@example.com"
    jwtKey := "testkey"

    // JWTトークンを生成
    tokenString, err := GenerateJWT(userID, userEmail, jwtKey)
    if err != nil {
        t.Fatalf("Failed to generate token: %v", err)
    }

    // 生成されたトークンを解析
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        return []byte(jwtKey), nil
    })
    if err != nil {
        t.Fatalf("Failed to parse token: %v", err)
    }

    // Claimsを検証
    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        if claims.ID != userID {
            t.Errorf("Expected UserID %v, got %v", userID, claims.ID)
        }
        if claims.Email != userEmail {
            t.Errorf("Expected Email %v, got %v", userEmail, claims.Email)
        }
        if claims.ExpiresAt <= time.Now().Unix() {
            t.Errorf("Token expires too soon")
        }
    } else {
        t.Errorf("Token is not valid")
    }
}


func TestGenerateCSRFToken(t *testing.T) {
    token, err := GenerateCSRFToken()
    if err != nil {
        t.Fatalf("Failed to generate CSRF token: %v", err)
    }

    if len(token) == 0 {
        t.Errorf("Generated token is empty")
    }

    // ベース64エンコードされた32バイトの長さを確認（通常は44文字）
    if len(token) != 44 {
        t.Errorf("Expected token length of 44, got %v", len(token))
    }
}


func TestValidateToken(t *testing.T) {
    validToken, _ := GenerateJWT(123, "test@example.com", "testkey")
    authHeader := "Bearer " + validToken

    _, err := ValidateToken(authHeader, "testkey")
    if err != nil {
        t.Errorf("Valid token was not accepted: %v", err)
    }

    _, err = ValidateToken("InvalidTokenFormat", "testkey")
    if err == nil {
        t.Errorf("Invalid token format was accepted")
    }

    _, err = ValidateToken("Bearer InvalidToken", "testkey")
    if err == nil {
        t.Errorf("Invalid token was accepted")
    }
}


func TestAuthHandler(t *testing.T) {
    jwtKey := "testkey"
    validToken, _ := GenerateJWT(123, "test@example.com", jwtKey)

    // OPTIONSリクエストのテスト
    req := httptest.NewRequest(http.MethodOptions, "/api/auth", nil)
    res := httptest.NewRecorder()
    AuthHandler(res, req, jwtKey)
    if res.Code != http.StatusOK {
        t.Errorf("OPTIONS request failed: expected status 200, got %v", res.Code)
    }

    // 有効なAuthorizationヘッダーを持つリクエストのテスト
    req = httptest.NewRequest(http.MethodGet, "/api/auth", nil)
    req.Header.Set("Authorization", "Bearer "+validToken)
    res = httptest.NewRecorder()
    AuthHandler(res, req, jwtKey)
    if res.Code != http.StatusOK {
        t.Errorf("Valid request failed: expected status 200, got %v", res.Code)
    }

    // 不正なAuthorizationヘッダーを持つリクエストのテスト
    req = httptest.NewRequest(http.MethodGet, "/api/auth", nil)
    req.Header.Set("Authorization", "InvalidToken")
    res = httptest.NewRecorder()
    AuthHandler(res, req, jwtKey)
    if res.Code == http.StatusOK {
        t.Errorf("Invalid request was accepted")
    }
}
