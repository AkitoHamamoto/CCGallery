package main

import (
    "database/sql"
    // "database/sql/driver"
    // "errors"
    // "testing"

    "github.com/DATA-DOG/go-sqlmock"
)

// OpenDatabaseMock はテスト用のモックデータベース接続を提供します。
func OpenDatabaseMock() (*sql.DB, sqlmock.Sqlmock, error) {
    db, mock, err := sqlmock.New()
    if err != nil {
        return nil, nil, err
    }
    return db, mock, nil
}

