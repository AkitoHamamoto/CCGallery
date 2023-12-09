import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

axios.defaults.withCredentials = true; // クロスオリジンCookieを許可

// Googleアカウントでの認証を行う関数（ダミー）
const handleGoogleLogin = () => {
  console.log('Googleアカウントでログインする');
  // 実際には、ここでGoogle認証処理を実装します。
};

const LoginScreen: React.FC = () => {
  // ユーザー入力を保持するステート
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // エラーメッセージ用のステート
  // const [csrfToken, setCsrfToken] = useState('');

  const navigate = useNavigate(); // navigate関数を取得

  // 入力ハンドラ
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  // ログイン処理
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/login', {
        email,
        password,
      });

      console.log('ログイン成功:', response.data);
      // JWTトークンをローカルストレージに保存
      localStorage.setItem('token', response.data.token);

      // レスポンスに含まれるCSRFトークンを更新
      // setCsrfToken(response.data.csrfToken);

      // ログインに成功したら、/userにリダイレクト
      navigate('/mypage');

    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // サーバーからのエラーレスポンスを表示
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('ログインに失敗しました。');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="max-w-md w-full space-y-8" style={{ transform: 'translateY(-10%)' }}>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            CCGalleryへようこそ
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            または続けるためにログイン
          </p>
        </div>
        <form onSubmit={handleLogin} className="mt-8 space-y-6" action="#" method="POST">
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">メールアドレス</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
                value={email}
                onChange={handleEmailChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">パスワード</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={password}
                onChange={handlePasswordChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login
            </button>
          </div>
        </form>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        <div>
          <button
            onClick={handleGoogleLogin}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-600 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Googleアカウントでログイン
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
