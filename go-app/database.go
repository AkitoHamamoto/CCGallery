package main

import (
    "database/sql"
    "os"
    _ "github.com/go-sql-driver/mysql"
)

type User struct {
    ID        int
    Email     string
    Password  string
    user_uuid string
    // 他に必要なフィールドがあればここに追加
}

type Database interface {
    GetUserByEmail(email string) (User, error)
}

type SQLDatabase struct {
    db *sql.DB
}

func OpenDatabase() (*sql.DB, error) {
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

func (db *SQLDatabase) GetUserByEmail(email string) (User, error) {
    var user User
    err := db.db.QueryRow("SELECT id, email, password FROM users WHERE email = ?", email).Scan(&user.ID, &user.Email, &user.Password)
    if err != nil {
        return User{}, err
    }
    return user, nil
}

