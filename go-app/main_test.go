package main

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
    // "github.com/DATA-DOG/go-sqlmock"
    // "strings"
	"os"
)

func TestMain(m *testing.M) {
    // 環境変数の設定
    os.Setenv("JWT_SECRET_KEY", "test_jwt_key")

    // テストの実行
    code := m.Run()

    // テスト後のクリーンアップ
    os.Unsetenv("JWT_SECRET_KEY")

    // テスト終了
    os.Exit(code)
}


func verifyResponse(t *testing.T, w *httptest.ResponseRecorder, expectedStatusCode int, expectedMessage string, expectToken bool) {
    res := w.Result()
    defer res.Body.Close()

    // ステータスコードの検証
    if res.StatusCode != expectedStatusCode {
        t.Errorf("Expected status %v, got %v", expectedStatusCode, res.StatusCode)
    }

    // レスポンスボディの検証
    var responseData ResponseData
    if err := json.NewDecoder(res.Body).Decode(&responseData); err != nil {
        t.Fatalf("Failed to decode response body: %v", err)
    }

    if responseData.Message != expectedMessage {
        t.Errorf("Expected message '%v', got '%v'", expectedMessage, responseData.Message)
    }

    if expectToken && responseData.Token == "" {
        t.Errorf("Expected token, got an empty string")
    } else if !expectToken && responseData.Token != "" {
        t.Errorf("Did not expect a token, but got '%v'", responseData.Token)
    }
}



func TestAuthEndpoint(t *testing.T) {
    // 環境変数のセットアップ（テスト用のJWT鍵など）
    os.Setenv("JWT_SECRET_KEY", "test_jwt_key")
    jwtKey := os.Getenv("JWT_SECRET_KEY")

    // ハンドラのセットアップ
    http.HandleFunc("/api/auth", func(w http.ResponseWriter, r *http.Request) {
        AuthHandler(w, r, os.Getenv("JWT_SECRET_KEY"))
    })

    // テスト用のリクエストを作成
    req, _ := http.NewRequest("GET", "/api/auth", nil)

    // テスト用のJWTトークンをセット
    validToken, _ := GenerateJWT(123, "test@example.com", os.Getenv("JWT_SECRET_KEY"))
    req.Header.Set("Authorization", "Bearer "+validToken)

    // レスポンスライターのモック
    rr := httptest.NewRecorder()

    // ラップされたハンドラ関数の定義
    testHandler := func(w http.ResponseWriter, r *http.Request) {
        AuthHandler(w, r, jwtKey)
    }

    // ラップされたハンドラ関数を実行
    handler := http.HandlerFunc(testHandler)
    handler.ServeHTTP(rr, req)

    // レスポンスのステータスコードの検証
    if status := rr.Code; status != http.StatusOK {
        t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
    }


    // 必要に応じてレスポンスボディも検証
}


// func TestRegisterHandler(t *testing.T) {
//     // モックデータベースのセットアップ
//     db, mock, err := OpenDatabaseMock()
//     if err != nil {
//         t.Fatalf("Error creating mock database: %v", err)
//     }
//     defer db.Close()

//     // SQLクエリのモック設定
//     mock.ExpectQuery("SELECT id FROM users WHERE email = ?").
//         WithArgs("test@example.com").
//         WillReturnRows(sqlmock.NewRows([]string{"id"}))

//     mock.ExpectExec("INSERT INTO users").
//         WithArgs("test@example.com", sqlmock.AnyArg(), sqlmock.AnyArg()).
//         WillReturnResult(sqlmock.NewResult(1, 1))

//     // テストケース
//     testCases := []struct {
//         name           string
//         email          string
//         password       string
//         expectedStatus int
//     }{
//         {"ValidRequest", "test@example.com", "password123", http.StatusOK},
//         {"InvalidEmail", "not-an-email", "password123", http.StatusBadRequest},
//         // 他のテストケース
//     }

//     for _, tc := range testCases {
//         t.Run(tc.name, func(t *testing.T) {
//             // リクエストボディの作成
//             body, _ := json.Marshal(Credentials{Email: tc.email, Password: tc.password})
//             req, _ := http.NewRequest("POST", "/api/register", bytes.NewBuffer(body))

//             // JWTキーの設定（環境変数またはデフォルト値）
//             jwtKey := os.Getenv("JWT_SECRET_KEY")
//             if jwtKey == "" {
//                 jwtKey = "default_jwt_key"
//             }

//             // ラッパー関数の作成
//             handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
//                 RegisterHandler(w, r, jwtKey)
//             })

//             // ハンドラーの実行
//             rr := httptest.NewRecorder()
//             handler.ServeHTTP(rr, req)

//             // ステータスコードの検証
//             if status := rr.Code; status != tc.expectedStatus {
//                 t.Errorf("handler returned wrong status code: got %v want %v",
//                     status, tc.expectedStatus)
//             }

//             // 応答内容の検証 (省略)
//         })
//     }

//     // モックの期待値が満たされたか確認
//     if err := mock.ExpectationsWereMet(); err != nil {
//         t.Errorf("there were unfulfilled expectations: %s", err)
//     }
// }

