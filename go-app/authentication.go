package main

import (
    "crypto/rand"
    "encoding/base64"
    "encoding/json"
    "errors"
    "github.com/dgrijalva/jwt-go"
    "net/http"
    "strings"
    "time"
	"log"
)

type Claims struct {
    ID    int    `json:"id"`
    Email string `json:"email"`
    jwt.StandardClaims
}

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

func GenerateCSRFToken() (string, error) {
    b := make([]byte, 32)
    _, err := rand.Read(b)
    if err != nil {
        return "", err
    }
    return base64.StdEncoding.EncodeToString(b), nil
}

func ValidateToken(authHeader string, jwtKey string) (*Claims, error) {
	headerParts := strings.Split(authHeader, " ")
	if len(headerParts) != 2 || headerParts[0] != "Bearer" {
		return nil, errors.New("Authorization header must be in format 'Bearer {token}'")
	}

	tokenString := headerParts[1]
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtKey), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("Invalid token")
	}

	return claims, nil
}

func AuthHandler(w http.ResponseWriter, r *http.Request, jwtKey string) {
    // CORSプリフライトリクエストへの対応
    if r.Method == "OPTIONS" {
        EnableCORS(w)
        w.WriteHeader(http.StatusOK)
        return
    }

    EnableCORS(w) // 通常のリクエストに対するCORSヘッダーの設定


    // AuthorizationヘッダーからJWTトークンを検証
    claims, err := ValidateToken(r.Header.Get("Authorization"), jwtKey)
    if err != nil {
        // エラーの内容に基づいた適切なHTTPステータスコードでレスポンスを返す
        httpStatus := http.StatusUnauthorized
        if err == jwt.ErrSignatureInvalid {
            log.Println("Auth Error: Token signature is invalid")
            httpStatus = http.StatusUnauthorized // トークンの署名が無効
        } else {
            log.Printf("Auth Error: Error parsing token: %v\n", err)
            httpStatus = http.StatusBadRequest // トークンの解析エラー
        }
        http.Error(w, err.Error(), httpStatus)
        return
    }

    // トークンが有効であれば、認証成功のレスポンスを返す
    log.Println("Auth Success: Token is valid")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(claims)
}
