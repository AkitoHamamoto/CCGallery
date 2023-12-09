package main

import (
    "net/http"
)

func EnableCORS(w http.ResponseWriter) {
    // CORSヘッダーの設定
    w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000") // Reactアプリのオリジンを指定
    w.Header().Set("Access-Control-Allow-Credentials", "true") // クレデンシャルを許可
    w.Header().Set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-TOKEN") // X-CSRF-TOKENを追加
    w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
}