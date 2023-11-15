import React, { useEffect, useState } from 'react';
import Header from './components/Layout/Header';
import { FaTwitter, FaGithub, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import { marked, Lexer, Tokens, Token } from 'marked';
import DOMPurify from 'dompurify';
import './MarkdownStyles.css';
import Prism from 'prismjs';
window.Prism = Prism;
require('prismjs/themes/prism.css');


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
  // 仮のプロフィールデータと記事データ
  const profile = {
    name: "misuken",
    image: "images/sample.png", // プロフィール画像のパス
    sns: {
      github: "https://github.com/misuken",
      twitter: "https://twitter.com/misuken",
      instagram: "https://instagram.com/misuken",
      youtube: "https://www.youtube.com/",
      tiktok: "https://www.tiktok.com/"
    },
    bio: "React/TypeScript/Sass/BCD Design(発案)/AtomicDesign/DB設計/DBチューニング/正規表現/DDD/柔軟な設計/分類/依存関係整理や責務の境界を見抜くのが得意。 AtomicDesign でモヤモヤしてる人には BCD Design がオススメです"
  };

  const [articleContent, setArticleContent] = useState('');
  const [safeHtmlContent, setSafeHtmlContent] = useState('');
  const [toc, setToc] = useState<string[]>([]); // 目次の状態をstring[]型で初期化

  useEffect(() => {
    // 非同期関数を定義して即時実行
    (async () => {
      const response = await fetch('/text/articleContent.txt');
      const text = await response.text();
      const tokens = marked.lexer(text);
      await highlightCode(tokens);
      const headers = tokens
        .filter(isHeadingToken) // 型ガードを使用して見出しをフィルタリング
        .map(heading => heading.text); // 見出しのテキストを取得
      setToc(headers); // 目次を状態にセット

      // マークダウンをHTMLに変換
      const unsafeHtml = marked.parser(tokens);
      // DOMPurifyを使用してサニタイズ
      const safeHtml = DOMPurify.sanitize(unsafeHtml);
      setArticleContent(safeHtml);
    })();
  }, []);

  useEffect(() => {
    setSafeHtmlContent(articleContent); // サニタイズされたHTMLをセーフHTMLコンテンツステートに保存
  }, [articleContent]);

  const article = {
    title: "Tauri + Vite + MantineUI",
    subtitle: "Tauri + Vite + MantineUI でiOS向けのアプリを作り、AppStoreに配信する",
    content: articleContent,
    updateDate: "2023/11-12" // 記事の更新日
  };

  // SNSアカウントのアイコンをレンダリングする関数
  const renderSnsIcon = (snsName: string, url: string) => {
    const icons: { [key: string]: JSX.Element } = {
      github: <FaGithub size={20} className="text-gray-500" />,
      twitter: <FaTwitter size={20} className="text-gray-500" />,
      instagram: <FaInstagram size={20} className="text-gray-500" />,
      youtube: <FaYoutube size={20} className="text-gray-500" />,
      tiktok: <FaTiktok size={17} className="text-gray-500" />,
    };

    const IconComponent = icons[snsName];
    return url && IconComponent ? (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mr-2">
        {IconComponent}
      </a>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header /> {/* ヘッダーコンポーネントの追加 */}
      <main className="p-6 md:p-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold m-2">{article.title}</h1>
            <p className="text-xl text-gray-600 m-2">{article.subtitle}</p>
            <p className="text-sm text-gray-500 m-2">{`最終更新日: ${article.updateDate}`}</p> {/* 更新日の表示 */}
          </div>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 記事の内容を表示するカード */}
            <div className="lg:w-auto bg-white shadow-lg p-10 rounded-lg">
              {/* Markdownから変換されたHTMLを表示 */}
              <div className="article-content" dangerouslySetInnerHTML={{ __html: safeHtmlContent }} />
            </div>

            {/* プロフィールカード */}
            <div className="lg:w-96">
              <div className="flex flex-col w-100 bg-white shadow-lg p-8 rounded-lg">
                <div className="flex items-center mb-4">
                  <img src={profile.image} alt="Profile" className="w-16 h-16 rounded-full object-cover mr-4" />
                  <div>
                    <h2 className="text-lg font-bold">{profile.name}</h2>
                    <div className="flex">
                      {Object.entries(profile.sns).map(([key, value]) => (
                        <div key={key} className="flex">
                          {renderSnsIcon(key, value)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">{profile.bio}</p>
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
