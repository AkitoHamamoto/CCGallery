import React, { useState } from 'react';
import Header from './components/Layout/Header';
import 'tailwindcss/tailwind.css';
import { MdFileUpload, MdCancel } from 'react-icons/md';

// デモの技術スタックデータ
const techStacks = [
  "JavaScript",
  "React",
  "Node.js",
  "Express",
  "MongoDB",
  "TypeScript",
  "CSS",
  "HTML"
];

const PostCreation: React.FC = () => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState(''); // GitHubリポジトリURLのためのステート
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  {/* 画像アップロード */ }
  // 画像アップロードハンドラー
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target && e.target.result) {
          setThumbnail(e.target.result as string);
        }
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };


  {/* 技術スタック */ }
  // 新しいタグの入力に応じてレコメンドタグを更新する
  const updateSuggestedTags = (input: string) => {
    if (input.length === 0) {
      setSuggestedTags([]);
    } else {
      const newSuggestedTags = techStacks.filter(
        (tech) => tech.toLowerCase().includes(input.toLowerCase()) && !tags.includes(tech)
      );
      setSuggestedTags(newSuggestedTags);
    }
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
  const adjustHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'inherit';
    element.style.height = `${element.scrollHeight}px`;
  };


  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <Header />

      <main className="p-6 md:p-20">
        <div className="max-w-4xl mx-auto">

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
                onChange={handleImageUpload}
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
              onChange={(e) => {
                setNewTag(e.target.value);
                updateSuggestedTags(e.target.value);
              }}
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
              placeholder="本文"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                adjustHeight(e.target);
              }}
              className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none overflow-hidden h-60vh md:h-55vh"
              style={{ resize: 'none' }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostCreation;
