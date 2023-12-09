import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import 'tailwindcss/tailwind.css';
import { MdFileUpload, MdCancel } from 'react-icons/md';

type PortfolioData = {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  github_repo_url: string;
  content: string;
  status: string;
  tags: string;
};

const PostCreation: React.FC = () => {
  // URLからidクエリパラメータを取得
  const [searchParams] = useSearchParams();
  const portfolioId = searchParams.get('id');

  // 技術スタックの全リストを保持する状態
  const [allTechStacks, setAllTechStacks] = useState<string[]>([]);

  // stateを定義
  // const [portfolioId, setPortfolioId] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [status, setStatus] = useState('0'); // 公開状況の状態
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const navigate = useNavigate(); // ページ遷移用のフック

  const options = {
    '0': '未公開',
    '1': '公開',
    '2': '限定公開'
  };

  // ポートフォリオデータを取得する
  useEffect(() => {
    const jwtToken = localStorage.getItem('token');
    if (portfolioId) {
      const fetchPortfolio = async () => {
        try {
          const response = await fetch(`http://localhost:8080/api/portfolio?id=${portfolioId}`, {
            headers: {
              'Authorization': `Bearer ${jwtToken}`,
            },
          });

          console.log(portfolioId);

          if (!response.ok) {
            throw new Error('Failed to fetch portfolio data');
          }

          const portfolio = await response.json();
          console.log(portfolio);
          // データを状態にセットする
          setTitle(portfolio.title || '');
          setSubtitle(portfolio.subtitle || '');
          setThumbnail(portfolio.thumbnail || '');
          setGithubRepoUrl(portfolio.github_repo_url || '');
          setContent(portfolio.content || '');
          setStatus(portfolio.status || '0');
          setTags(portfolio.tags ? portfolio.tags.split(',') : []);
        } catch (error) {
          console.error('Error fetching portfolio data:', error);
        }
      };

      fetchPortfolio();
    } else {
      // IDがない場合は新規作成として扱い、すべてのフィールドを初期化する
      setTitle('');
      setSubtitle('');
      setThumbnail('');
      setGithubRepoUrl('');
      setContent('');
      setStatus('0');
      setTags([]);
    }
  }, [portfolioId]);


  // ポートフォリオを保存する関数
  const savePortfolio = async (portfolioData: PortfolioData) => {
    const jwtToken = localStorage.getItem('token');
    const method = portfolioId ? 'PUT' : 'POST';
    const endpoint = `http://localhost:8080/api/portfolio${portfolioId ? `?id=${portfolioId}` : ''}`;

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(portfolioData),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      // 成功したら結果をログに表示
      const result = await response.json();
      console.log('Portfolio saved:', result);
      navigate('/mypage');

    } catch (error) {
      console.error('Error saving portfolio data:', error);
    }
  };

  // 保存ボタンが押されたときの処理
  const handleSaveButtonClick = () => {
    const portfolioData = {
      id: portfolioId || '', // 編集時には既存のポートフォリオのIDを使用
      title: title,
      subtitle: subtitle,
      thumbnail: thumbnail,
      github_repo_url: githubRepoUrl,
      content: content,
      status: status,
      tags: tags.join(','), // タグはカンマ区切りの文字列として結合
    };

    savePortfolio(portfolioData);
  };


  {/* 画像アップロード */ }
  // 画像をサーバーにアップロードし、画像のURLを返す関数
  const uploadPortfolioImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    // JWTトークンをローカルストレージから取得する
    const jwtToken = localStorage.getItem('token');

    const response = await fetch('http://localhost:8080/api/portfolio/image', {
      method: 'POST',
      headers: {
        // トークンをヘッダーに含める
        'Authorization': `Bearer ${jwtToken}`
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('画像のアップロードに失敗しました');
    }

    const data = await response.json();
    return data.imageUrl; // サーバーのレスポンスに合わせてプロパティを調整する
  };

  // ポートフォリオ画像アップロードハンドラー
  const handleThumbnailImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      try {
        // サーバーにアップロードし、画像のURLを取得
        const imageUrl = await uploadPortfolioImage(event.target.files[0]);
        // 状態を更新
        setThumbnail(imageUrl);
        // 画像のURLをポートフォリオデータに追加して保存処理を実行
        // handleChange('thumbnail', imageUrl); // この関数はポートフォリオデータを更新するために使われる
      } catch (error) {
        console.error('画像のアップロード中にエラーが発生しました:', error);
      }
    }
  };


  {/* 技術スタック */ }
  // コンポーネントがマウントされた時に一度だけ全技術スタックを取得
  useEffect(() => {
    fetchTechStacks();
  }, []);

  // 技術スタックを取得する関数
  const fetchTechStacks = async () => {
    // ユーザーが一文字を入力したときだけAPIを呼び出す
    try {
      const response = await fetch(`http://localhost:8080/api/techstacks`);
      if (!response.ok) {
        throw new Error('Failed to fetch tech stacks');
      }
      const data = await response.json();
      console.log(data);
      setAllTechStacks(data);
    } catch (error) {
      console.error(error);
    }
  };


  // 新しいタグの入力フィールドのonChangeハンドラー
  const handleNewTagChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setNewTag(inputValue); // 新しいタグの状態を更新
    // 入力値に基づいてフィルタリングを行う
    const filteredTechStacks = allTechStacks.filter(tech =>
      tech.toLowerCase().startsWith(inputValue.toLowerCase())
    );
    setSuggestedTags(filteredTechStacks);
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags(prevTags => [...prevTags, tag]);
    }
    setNewTag(''); // 新しいタグの入力フィールドを空にする
    setSuggestedTags([]); // レコメンドリストをクリアする
    setSelectedIndex(-1); // 選択されたインデックスをリセットする
  };

  // タグの削除ハンドラー
  const removeTag = (index: number) => {
    setTags(prevTags => prevTags.filter((_, tagIndex) => index !== tagIndex));
  };


  // キーボードナビゲーションハンドラ
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // 選択されたレコメンドタグを追加
      if (selectedIndex >= 0 && selectedIndex < suggestedTags.length) {
        addTag(suggestedTags[selectedIndex]);
      } else {
        // 新しいタグを追加
        addTag(newTag);
      }
    } else if (e.key === 'ArrowDown') {
      // 下キーで選択インデックスを増やす
      setSelectedIndex((prevIndex) =>
        prevIndex < suggestedTags.length - 1 ? prevIndex + 1 : prevIndex
      );
    } else if (e.key === 'ArrowUp') {
      // 上キーで選択インデックスを減らす
      setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
    }
  };


  {/* 本文 */ }
  // テキストエリアの高さを自動調整する
  // 最小のテキストエリアの高さを設定する
  const MIN_TEXTAREA_HEIGHT = 250; // 例えば、160ピクセル

  // テキストエリアの高さを自動調整する
  const adjustHeight = (element: HTMLTextAreaElement) => {
    // 現在のテキストエリアのスタイルを取得
    const previousHeight = element.style.height;

    // クローンを作成して内容の高さを測定
    const clone = element.cloneNode(true) as HTMLTextAreaElement;
    clone.style.height = 'auto';
    clone.style.visibility = 'hidden';
    clone.style.position = 'absolute';
    document.body.appendChild(clone);
    const cloneScrollHeight = clone.scrollHeight;
    document.body.removeChild(clone);

    // 新しい高さを計算
    const newHeight = Math.max(cloneScrollHeight, MIN_TEXTAREA_HEIGHT);

    // 新しい高さが現在の高さと異なる場合のみ高さを更新
    if (previousHeight !== `${newHeight}px`) {
      element.style.height = `${newHeight}px`;
    }
  };


  useEffect(() => {
    // テキストエリア要素を取得する
    const textareaElement = document.getElementById('input-content') as HTMLTextAreaElement;
    // ポートフォリオIDがある場合、または本文がある場合に高さを調整する
    if (textareaElement) {
      adjustHeight(textareaElement);
    }
  }, [content]);


  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <Header />

      <main className="p-6 md:p-20">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* 保存ボタンと公開状況のセレクトボックス */}
          <div className="flex justify-end items-center mb-4 space-x-2">
            {/* 公開状況のセレクトボックス */}
            <div className="mr-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                style={{ width: 'auto' }}  // またはTailwind CSSの幅クラスを使用
              >
                <option value="0">未公開</option>
                <option value="1">公開</option>
                <option value="2">限定公開</option>
              </select>
            </div>
            {/* 保存ボタン */}
            <button
              onClick={handleSaveButtonClick}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition ease-in-out duration-300"
            >
              保存
            </button>
          </div>


          {/* タイトルの入力欄 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* サブタイトルの入力欄 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full text-xl bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* サムネイル画像URL入力欄 */}
          <div className="mb-4 flex items-center">
            <input
              type="text"
              placeholder="サムネイル画像URL"
              value={typeof thumbnail === 'string' ? thumbnail : ''}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
            />
            <label className="ml-4 cursor-pointer">
              <MdFileUpload size={24} className="text-gray-700" />
              <input
                type="file"
                onChange={handleThumbnailImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* GitHubリポジトリURLの入力欄 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="GitHubリポジトリURL"
              value={githubRepoUrl}
              onChange={(e) => setGithubRepoUrl(e.target.value)}
              className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* 技術スタックを追加欄 */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder="技術スタックを追加..."
              value={newTag}
              onChange={handleNewTagChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
            />
            {suggestedTags.length > 0 && (
              <ul className="absolute left-0 right-0 bg-white shadow-lg max-h-60 overflow-y-auto">
                {suggestedTags.map((suggestedTag, index) => (
                  <li
                    key={index}
                    onClick={() => addTag(suggestedTag)}
                    onMouseOver={() => setSelectedIndex(index)}
                    onMouseOut={() => setSelectedIndex(-1)}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${index === selectedIndex ? 'bg-gray-200' : ''
                      }`}
                  >
                    {suggestedTag}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <div key={index} className="flex items-center bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                  {tag}
                  <MdCancel className="text-gray-500 cursor-pointer ml-2" onClick={() => removeTag(index)} />
                </div>
              ))}
            </div>
          </div>

          {/* 本文の入力欄 */}
          <div className="mb-4">
            <textarea
              id="input-content" // id を追加する
              placeholder="本文"
              value={content}
              onInput={(e) => adjustHeight(e.target as HTMLTextAreaElement)}
              onChange={(e) => {
                setContent(e.target.value);
                // adjustHeight(e.target);
              }}
              className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none overflow-hidden"
              style={{ resize: 'none', minHeight: `${MIN_TEXTAREA_HEIGHT}px` }} // minHeight をスタイルに適用する
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostCreation;
