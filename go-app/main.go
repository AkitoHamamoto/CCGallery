// main.go
package main

import (
    "net/http"
)

func main() {
    http.HandleFunc("/api/data", func(w http.ResponseWriter, r *http.Request) {
        // ここでデータを返す処理を書きます。
    })

    http.ListenAndServe(":8080", nil)
}
