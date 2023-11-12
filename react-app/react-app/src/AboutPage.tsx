import React from 'react';
import Header from './components/Layout/Header';
import 'tailwindcss/tailwind.css';
import './App.css'; // CSSファイルは適宜作成してください。
import './index.css'; // CSSファイルは適宜作成してください。

// 画像や情報はプロジェクトごとに適宜変更してください。
const projects = [
  {
    id: 1,
    title: 'CCGallery',
    image: 'images/sample.png',
    subtitle: 'ポートフォリオ共有アプリケーション',
    tags: ['Go', 'React', 'MySQL'],
  },
  {
    id: 2,
    title: 'CCGallery',
    image: 'images/sample.png',
    subtitle: 'ポートフォリオ共有アプリケーション',
    tags: ['Go', 'React', 'MySQL'],
  },
  {
    id: 3,
    title: 'CCGallery',
    image: 'images/sample.png',
    subtitle: 'ポートフォリオ共有アプリケーション',
    tags: ['Go', 'React', 'MySQL'],
  },
  {
    id: 4,
    title: 'CCGallery',
    image: 'images/sample.png',
    subtitle: 'ポートフォリオ共有アプリケーション',
    tags: ['Go', 'React', 'MySQL'],
  },
  {
    id: 5,
    title: 'CCGallery',
    image: 'images/sample.png',
    subtitle: 'ポートフォリオ共有アプリケーション',
    tags: ['Go', 'React', 'MySQL'],
  },
  {
    id: 6,
    title: 'CCGallery',
    image: 'images/sample.png',
    subtitle: 'ポートフォリオ共有アプリケーション',
    tags: ['Go', 'React', 'MySQL'],
  },
  {
    id: 7,
    title: 'CCGallery',
    image: 'images/sample.png',
    subtitle: 'ポートフォリオ共有アプリケーション',
    tags: ['Go', 'React', 'MySQL'],
  },
  {
    id: 8,
    title: 'CCGallery',
    image: 'images/sample.png',
    subtitle: 'ポートフォリオ共有アプリケーション',
    tags: ['Go', 'React', 'MySQL'],
  },
  {
    id: 9,
    title: 'CCGallery',
    image: 'images/sample.png',
    subtitle: 'ポートフォリオ共有アプリケーション',
    tags: ['Go', 'React', 'MySQL'],
  },
];

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <main className="p-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* カードを生成 */}
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <img src={project.image} alt={project.title} className="w-full h-auto" />
              <div className="p-5">
                <h2 className="text-lg font-bold">{project.title}</h2>
                <p className="text-gray-700">{project.subtitle}</p>
                <div className="mt-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className={`tag-${tag} text-xs font-semibold inline-block py-1 px-2.5 rounded text-white bg-blue-600 mr-2`}>
                      {tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
