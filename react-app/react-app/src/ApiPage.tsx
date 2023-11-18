import React, { useState, useEffect } from 'react';

interface ResponseData {
  message: string;
}

const HelloComponent: React.FC = () => {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    // APIを呼び出す関数
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/hello');
        const data: ResponseData = await response.json();
        setMessage(data.message); // ステートを更新
      } catch (error) {
        console.error('Error fetching data: ', error);
        setMessage('Error fetching data'); // エラーメッセージをステートにセット
      }
    };

    fetchData();
  }, []); // 空の依存配列でマウント時に1回だけ実行

  return (
    <div>
      <p>{message}</p> {/* メッセージを表示 */}
    </div>
  );
};

export default HelloComponent;
