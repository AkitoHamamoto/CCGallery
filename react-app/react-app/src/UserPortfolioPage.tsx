// UserPortfolioPage.tsx

import React, { useEffect, useState } from 'react';
import Header from './components/Layout/Header';
import usePortfolioProfileData from './Hooks/usePortfolioProfileData';
import usePortfolioData from './Hooks/usePortfolioData';
import useMarkdown from './Hooks/useMarkdown';
import SnsIcon from './components/UI/SnsIcon';
import ErrorPage from './components/Layout/ErrorPage';
import './App.css';


const ArticleDetail = () => {
  // URLからポートフォリオIDを取得
  const urlParams = new URLSearchParams(window.location.search);
  const portfolioId = urlParams.get('id');

  // ポートフォリオIDからポートフォリオデータ＋プロフィールデータを取得
  const { portfolio, error } = usePortfolioData(portfolioId);
  const profile = usePortfolioProfileData(portfolioId || '');

  // マークダウンの内容（ポートフォリオ記事）をHTMLに変換し、目次を生成。
  const { htmlContent, toc } = useMarkdown(portfolio?.content || '');


  if (error) {
    // エラーがある場合はErrorPageコンポーネントを表示
    return (
      <>
        <Header />
        <main className="p-6 md:p-20">
          <ErrorPage statusCode={404} message="お探しのページが見つかりませんでした。" />
        </main>
      </>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100">
      <Header /> {/* ヘッダーコンポーネントの追加 */}
      <main className="p-6 md:p-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold m-2">{portfolio?.title}</h1>
            <p className="text-xl text-gray-600 m-2">{portfolio?.subtitle}</p>
            <p className="text-sm text-gray-500 m-2">
              最終更新日: {portfolio?.updated_at ? new Intl.DateTimeFormat('ja-JP').format(new Date(portfolio.updated_at)) : ''}
            </p>
          </div>
          <div className="flex flex-col lg:flex-row gap-8 justify-center">
            {/* 記事の内容を表示するカード */}
            <div className="flex-grow bg-white shadow-lg p-10 rounded-lg min-w-0 max-w-full">
              {/* Markdownから変換されたHTMLを表示 */}
              <div className="article-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>

            {/* プロフィールカード */}
            <div className="lg:w-96" style={{ minWidth: '300px' }}>
              <div className="flex flex-col w-full bg-white shadow-lg p-8 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <img src={`http://localhost:8080/${profile?.profile_image}`} alt="Profile" className="w-16 h-16 rounded-full object-cover mr-4" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h2 className="text-lg font-bold overflow-x-auto whitespace-nowrap no-scrollbar">{profile?.username}</h2>
                    <div className="flex">
                      <SnsIcon snsName="github" url={profile?.github_url} />
                      <SnsIcon snsName="twitter" url={profile?.twitter_url} />
                      <SnsIcon snsName="instagram" url={profile?.instagram_url} />
                      <SnsIcon snsName="youtube" url={profile?.youtube_url} />
                      <SnsIcon snsName="tiktok" url={profile?.tiktok_url} />
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">{profile?.bio}</p>
              </div>

              {/* 記事の目次を表示するカード */}
              <div className="mt-4 bg-white shadow-lg p-4 rounded-lg sticky top-5 hidden md:block">
                <h3 className="text-lg font-bold mb-4 pl-0">目次</h3>
                <ul className="list-none pl-1">
                  {toc.map((item, index) => (
                    <li key={index} className="mb-2">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArticleDetail;
