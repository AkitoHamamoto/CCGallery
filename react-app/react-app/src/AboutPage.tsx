// AboutPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit } from 'react-icons/fa';
import Header from './components/Layout/Header';
import 'tailwindcss/tailwind.css';
import useProfileData from './Hooks/useProfileData';
import usePortfolios from './Hooks/usePortfolios';
import { useEventHandlers } from './Handlers/eventHandlers';
import SnsIcon from './components/UI/SnsIcon';
import './App.css'; // CSSファイルは適宜作成してください。
import './index.css'; // CSSファイルは適宜作成してください。


const App: React.FC = () => {
  // const navigate = useNavigate();

  // マイポートフォリオ一覧取得
  const Portfolios = usePortfolios();

  console.log(Portfolios);

  // ユーザープロフィール取得
  const ProfileData = useProfileData();

  // // プロジェクトがクリックされた時に呼ばれる関数
  // const handlePortfolioClick = (portfolio_uuid: string) => {
  //   navigate(`/show?id=${portfolio_uuid}`); // ここでナビゲート処理を行う
  // };

  // // ユーザー情報編集
  // const handleUserClick = () => {
  //   navigate('/user');
  // };

  // // ポートフォリオ記事の編集画面遷移
  // const handleEditIconClick = (event: React.MouseEvent<HTMLElement>, portfolio_uuid: string) => {
  //   event.stopPropagation(); // カードのクリックイベントが発火しないようにする
  //   navigate(`/create?id=${portfolio_uuid}`); // 編集画面へのナビゲート
  // };

  const { handlePortfolioClick, handleUserClick, handleEditIconClick } = useEventHandlers();

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <Header />

      {/* プロフィールセクション */}
      <div className="bg-white py-10">
        <div className="max-w-4xl mx-auto px-10">
          {/* ユーザーのアイコンと名前、SNSリンク、自己紹介 */}
          <div className="text-center">
            <img
              src={`http://localhost:8080/${ProfileData?.profile_image}`}
              alt="User Profile"
              className="mx-auto w-32 h-32 rounded-full object-cover cursor-pointer"
              onClick={() => handleUserClick()}
            />
            <h1 className="text-3xl font-bold mt-4">{ProfileData?.full_name}</h1>
            <p className="text-gray-600 mt-2">{ProfileData?.bio}</p>
            <div className="flex justify-center mt-4">
              <SnsIcon snsName="github" url={ProfileData?.github_url} />
              <SnsIcon snsName="twitter" url={ProfileData?.twitter_url} />
              <SnsIcon snsName="instagram" url={ProfileData?.instagram_url} />
              <SnsIcon snsName="youtube" url={ProfileData?.youtube_url} />
              <SnsIcon snsName="tiktok" url={ProfileData?.tiktok_url} />
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="p-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* カードを生成 */}
          {Portfolios.map((Portfolio) => (
            <div
              key={Portfolio.portfolio_uuid}
              className="relative flex flex-col bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer"
              // style={{ aspectRatio: '5 / 4' }} // アスペクト比を1:1で設定
              onClick={() => handlePortfolioClick(Portfolio.portfolio_uuid)}
            >
              {/* 画像 */}
              <div className="w-full h-52 object-cover">
                <img
                  src={`http://localhost:8080/${Portfolio.image}`}
                  alt={Portfolio.title}
                  className="w-full h-full object-cover object-center" // 画像をエリアに合わせてトリミング
                />
              </div>
              {/* タイトル、サブタイトル、タグのコンテナ */}
              <div className="flex flex-col flex-grow p-5">
                <h2 className="text-lg font-bold truncate">
                  {Portfolio.title}
                  {/* ステータス表示用の点 */}
                  <span className={`status-dot status-${Portfolio.status}`}></span>
                </h2>
                <p className="text-gray-700 truncate flex-grow">
                  {Portfolio.subtitle}
                </p>
                <div className="flex-grow-0">
                  <div className="overflow-x-auto whitespace-nowrap no-scrollbar">
                    {Portfolio.tags.filter(tag => tag).length > 0 ? (
                      Portfolio.tags.filter(tag => tag).map((tag, index) => (
                        <span key={index} className={`tag-${tag} text-xs font-semibold inline-block py-1 px-2.5 rounded text-white bg-blue-600 mr-2`}>
                          {tag.toUpperCase()}
                        </span>
                      ))
                    ) : (
                      <span className="tag-none text-xs font-semibold inline-block py-1 px-2.5 rounded text-white bg-gray-600 mr-2">
                        none
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* ステップ2: 編集アイコンの追加 */}
              <div className="absolute top-0 right-0 p-2">
                <button
                  onClick={(event) => handleEditIconClick(event, Portfolio.portfolio_uuid)}
                  className="text-lg text-black-opacity-4 hover:text-gray-700">
                  <FaEdit size={22} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

};

export default App;
