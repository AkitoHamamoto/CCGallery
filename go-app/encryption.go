package main

import (
    // 必要なインポート
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
		"encoding/json"
		"net/http"
    "io"
    "os"
    // "strconv"
		"log"
		"fmt"
)

// システムの環境変数からAES秘密鍵を取得する
func getAESKey() []byte {
	key := os.Getenv("AES_SECRET_KEY")
	decodedKey, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		log.Fatalf("getAESKey: failed to decode AES key: %v", err)
	}
	if len(decodedKey) != 32 {
		log.Fatalf("getAESKey: decoded key length is not 32 bytes, key length: %d", len(decodedKey))
	}
	return decodedKey
}


// // EncryptID は与えられたIDをAESで暗号化し、Base64エンコードされた文字列を返します。
// func EncryptID(id int) (string, error) {
// 	key := getAESKey()
// 	if len(key) != 32 {
// 		return "", fmt.Errorf("EncryptID: key length is not 32 bytes, key length: %d", len(key))
// 	}

// 	block, err := aes.NewCipher(key)
// 	if err != nil {
// 		return "", fmt.Errorf("EncryptID: failed to create cipher block: %v", err)
// 	}

// 	plaintext := []byte(strconv.Itoa(id))
// 	ciphertext := make([]byte, aes.BlockSize+len(plaintext))
// 	iv := ciphertext[:aes.BlockSize]

// 	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
// 		return "", fmt.Errorf("EncryptID: failed to generate IV: %v", err)
// 	}

// 	stream := cipher.NewCFBEncrypter(block, iv)
// 	stream.XORKeyStream(ciphertext[aes.BlockSize:], plaintext)

// 	encodedID := base64.URLEncoding.EncodeToString(ciphertext)
// 	if len(encodedID) == 0 {
// 		return "", fmt.Errorf("EncryptID: failed to encode ciphertext")
// 	}

// 	return encodedID, nil
// }


// // DecryptID はBase64エンコードされた暗号文を受け取り、AESで復号化したIDを返します。
// func DecryptID(encoded string) (int, error) {
// 	ciphertext, err := base64.URLEncoding.DecodeString(encoded)
// 	if err != nil {
// 		return 0, err
// 	}

// 	block, err := aes.NewCipher(getAESKey())
// 	if err != nil {
// 		return 0, err
// 	}

// 	if len(ciphertext) < aes.BlockSize {
// 		return 0, err
// 	}

// 	iv := ciphertext[:aes.BlockSize]
// 	ciphertext = ciphertext[aes.BlockSize:]

// 	stream := cipher.NewCFBDecrypter(block, iv)
// 	stream.XORKeyStream(ciphertext, ciphertext)

// 	id, err := strconv.Atoi(string(ciphertext))
// 	if err != nil {
// 		return 0, err
// 	}

// 	return id, nil
// }

// EncryptString は与えられた文字列をAESで暗号化し、Base64エンコードされた文字列を返します。
func EncryptString(text string) (string, error) {
    key := getAESKey()
    block, err := aes.NewCipher(key)
    if err != nil {
        return "", fmt.Errorf("EncryptString: failed to create cipher block: %v", err)
    }

    plaintext := []byte(text)
    ciphertext := make([]byte, aes.BlockSize+len(plaintext))
    iv := ciphertext[:aes.BlockSize]

    if _, err := io.ReadFull(rand.Reader, iv); err != nil {
        return "", fmt.Errorf("EncryptString: failed to generate IV: %v", err)
    }

    stream := cipher.NewCFBEncrypter(block, iv)
    stream.XORKeyStream(ciphertext[aes.BlockSize:], plaintext)

    return base64.URLEncoding.EncodeToString(ciphertext), nil
}

// DecryptString はBase64エンコードされた暗号文を受け取り、AESで復号化した文字列を返します。
func DecryptString(encoded string) (string, error) {
    key := getAESKey()
    ciphertext, err := base64.URLEncoding.DecodeString(encoded)
    if err != nil {
        return "", fmt.Errorf("DecryptString: failed to decode ciphertext: %v", err)
    }

    if len(ciphertext) < aes.BlockSize {
        return "", fmt.Errorf("DecryptString: ciphertext too short")
    }

    block, err := aes.NewCipher(key)
    if err != nil {
        return "", fmt.Errorf("DecryptString: failed to create cipher block: %v", err)
    }

    iv := ciphertext[:aes.BlockSize]
    ciphertext = ciphertext[aes.BlockSize:]
    stream := cipher.NewCFBDecrypter(block, iv)

    // XORKeyStream can work in-place if the two arguments are the same.
    stream.XORKeyStream(ciphertext, ciphertext)

    return string(ciphertext), nil
}



func ValidateEncryptedUUID(w http.ResponseWriter, r *http.Request) {
    EnableCORS(w)

    if r.Method != http.MethodGet {
        http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        return
    }

    // クエリから暗号化されたUUIDを取得
    encryptedUUID := r.URL.Query().Get("pass")
    if encryptedUUID == "" {
        http.Error(w, "Encrypted UUID not provided", http.StatusBadRequest)
        return
    }

    // 暗号化されたUUIDを復号化
    decryptedUUID, err := DecryptString(encryptedUUID)
    if err != nil {
        http.Error(w, "Failed to decrypt UUID", http.StatusInternalServerError)
        return
    }

    db, err := OpenDatabase()
    if err != nil {
        http.Error(w, "Database connection error", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // 復号化したUUIDがデータベースに存在するかチェック
    var exists bool
    err = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE user_uuid = ?)`, decryptedUUID).Scan(&exists)
    if err != nil {
        http.Error(w, "Failed to query database", http.StatusInternalServerError)
        return
    }

    if !exists {
        http.Error(w, "UUID does not exist", http.StatusNotFound)
        return
    }

    // UUIDが存在する場合は成功のレスポンスを返す
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("Valid UUID"))
}

func GenerateEncryptedPass(w http.ResponseWriter, r *http.Request) {
    EnableCORS(w)

    if r.Method != http.MethodGet {
        http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        return
    }

    // クエリからUUIDを取得
    uuid := r.URL.Query().Get("uuid")
    if uuid == "" {
        http.Error(w, "UUID not provided", http.StatusBadRequest)
        return
    }

    // UUIDを暗号化
    encryptedPass, err := EncryptString(uuid)
    if err != nil {
        http.Error(w, "Failed to encrypt UUID", http.StatusInternalServerError)
        return
    }

    // 暗号化されたpassをクライアントに返す
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"pass": encryptedPass})
}
