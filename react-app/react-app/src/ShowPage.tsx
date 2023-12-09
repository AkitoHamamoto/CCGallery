import React, { useEffect, useState } from 'react';
import Header from './components/Layout/Header';
import { marked, Lexer, Tokens, Token } from 'marked';
import DOMPurify from 'dompurify';
import useProfileData from './Hooks/useProfileData';
import SnsIcon from './components/UI/SnsIcon';
import './MarkdownStyles.css';
import './App.css';
import Prism from 'prismjs';
window.Prism = Prism;
require('prismjs/themes/prism.css');


interface PortfolioData {
  title: string;
  subtitle: string;
  thumbnail: string;
  github_repo_url: string;
  content: string;
  tags: string; // タグはカンマ区切りの文字列として扱う
  updated_at: string;
}


// Token型が見出しであることを確認する型ガード
const isHeadingToken = (token: Tokens.Generic): token is Tokens.Heading => {
  return token.type === 'heading';
};

// 言語モジュールを動的にロードする関数
const loadLanguage = async (lang: string) => {
  if (!lang) return; // 言語が指定されていない場合は何もしない

  try {
    // PrismJSの言語ファイルを動的にロードする
    await require(`prismjs/components/prism-${lang}`);
  } catch (e) {
    console.warn(`Language '${lang}' not found in PrismJS`);
  }
};

// トークンから言語を抽出し、それに応じてハイライト処理を行う関数
const highlightCode = async (tokens: Token[]) => {
  for (const token of tokens) {
    if (token.type === 'code') {
      await loadLanguage(token.lang); // 言語モジュールをロード
      // ここでハイライト処理を実行する
      Prism.highlightAll();
    }
  }
  // すべてのハイライトが終わったらHTMLを更新する
};

const ArticleDetail = () => {
  // const [profile, setProfile] = useState<ProfileData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [articleContent, setArticleContent] = useState('');
  const [safeHtmlContent, setSafeHtmlContent] = useState('');
  const [toc, setToc] = useState<string[]>([]); // 目次の状態をstring[]型で初期化


  useEffect(() => {
    const fetchPortfolio = async () => {
      // JWTトークンをローカルストレージから取得
      const token = localStorage.getItem('token');

      // ヘッダーにトークンをセット
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      try {
        // URLからポートフォリオIDを取得
        const urlParams = new URLSearchParams(window.location.search);
        const portfolioId = urlParams.get('id');

        // ポートフォリオデータを取得
        if (portfolioId) {
          // ヘッダーにトークンをセットしてリクエストを送信
          const portfolioResponse = await fetch(`http://localhost:8080/api/portfolio?id=${portfolioId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const portfolioData = await portfolioResponse.json();
          console.log(portfolioData);
          setPortfolio(portfolioData);

          // マークダウンを解析してトークンを取得
          const tokens = marked.lexer(portfolioData.content);
          // トークンから言語を抽出してハイライト処理
          await highlightCode(tokens);

          // トークンから見出しをフィルタリングして目次を生成
          const headers = tokens
            .filter(isHeadingToken)
            .map(heading => heading.text);
          setToc(headers); // 目次を状態にセット

          // マークダウンをHTMLに変換してサニタイズ
          const unsafeHtml = marked.parser(tokens);
          const safeHtml = DOMPurify.sanitize(unsafeHtml);
          setArticleContent(safeHtml); // サニタイズされたHTMLを状態にセット
        }

      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchPortfolio();
  }, []);

  useEffect(() => {
    setSafeHtmlContent(articleContent); // サニタイズされたHTMLをセーフHTMLコンテンツステートに保存
  }, [articleContent]);


  // ユーザープロフィール取得
  const profile = useProfileData();


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
              <div className="article-content" dangerouslySetInnerHTML={{ __html: safeHtmlContent }} />
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
