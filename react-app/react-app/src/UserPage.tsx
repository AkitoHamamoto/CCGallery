import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import Header from './components/Layout/Header';
import { MdFileUpload, MdPerson, MdEmail, MdWork } from 'react-icons/md';
import { FaTwitter, FaGithub, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';


type ProfileData = {
  profile_image: string;
  full_name: string;
  username: string;
  contact_email: string;
  bio: string;
  twitter_url: string;
  github_url: string;
  instagram_url: string;
  youtube_url: string;
  tiktok_url: string;
};

const AccountCreation: React.FC = () => {
  const [profileImage, setProfileImage] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [bio, setBio] = useState('');
  const [snsUrls, setSnsUrls] = useState({
    twitter_url: '',
    github_url: '',
    instagram_url: '',
    youtube_url: '',
    tiktok_url: ''
  });

  // デバウンスされた保存処理
  const debouncedSave = useCallback(
    debounce(async (profileData: ProfileData) => {
      // JWTトークンをローカルストレージから取得する
      const jwtToken = localStorage.getItem('token');

      try {
        const response = await fetch('http://localhost:8080/api/profile', {
          method: profileData.username ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}` // トークンをヘッダーに含める
          },
          body: JSON.stringify(profileData),
        });

        console.log(profileData);

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const result = await response.json();
        console.log(result); // または適切なユーザーへのフィードバック
      } catch (error) {
        console.error('プロファイルの保存中にエラーが発生しました:', error);
      }
    }, 3000), // 3秒間のデバウンス
    [] // 依存関係がないので、コールバックはマウント時に一度だけ作成される
  );

  // 初回レンダリング時にプロフィールデータを取得する
  useEffect(() => {
    // JWTトークンをローカルストレージから取得
    const jwtToken = localStorage.getItem('token');
    // プロファイルデータのフェッチ
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/profile', {
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        console.log(data);
        if (data) {
          // 状態にデータをセット
          setProfileImage(data.profile_image || '');
          setFullName(data.full_name || '');
          setUsername(data.username);
          setContactEmail(data.contact_email || '');
          setBio(data.bio || '');
          setSnsUrls({
            twitter_url: data.twitter_url || '',
            github_url: data.github_url || '',
            instagram_url: data.instagram_url || '',
            youtube_url: data.youtube_url || '',
            tiktok_url: data.tiktok_url || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (name: keyof ProfileData | keyof typeof snsUrls, value: string) => {
    // ProfileDataに含まれるフィールドの場合
    if (name === 'full_name' || name === 'username' || name === 'contact_email' || name === 'bio') {
      switch (name) {
        case 'full_name':
          setFullName(value);
          break;
        case 'username':
          setUsername(value);
          if (!value) {
            alert('ユーザー名は空にできません。');
            return;
          }
          break;
        case 'contact_email':
          setContactEmail(value);
          break;
        case 'bio':
          setBio(value);
          break;
        // ここに他のProfileDataフィールドのcaseを追加する
        default:
          break;
      }
    } else if (name in snsUrls) {
      // snsUrlsに含まれるフィールドの場合
      setSnsUrls(prevSnsUrls => {
        const updatedSnsUrls = { ...prevSnsUrls, [name]: value };
        return updatedSnsUrls;
      });
    }
  };


  // 各状態変数が更新されたことを検知するためのuseEffectフック
  useEffect(() => {
    const updatedProfileData = {
      profile_image: profileImage,
      full_name: fullName,
      username: username,
      contact_email: contactEmail,
      bio: bio,
      twitter_url: snsUrls.twitter_url,
      github_url: snsUrls.github_url,
      instagram_url: snsUrls.instagram_url,
      youtube_url: snsUrls.youtube_url,
      tiktok_url: snsUrls.tiktok_url,
    };

    console.log("updatedProfileData:" + updatedProfileData);
    debouncedSave(updatedProfileData);
  }, [profileImage, fullName, username, contactEmail, bio, snsUrls, debouncedSave]);



  // 画像をサーバーにアップロードし、画像のURLを返す関数
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    // JWTトークンをローカルストレージから取得する
    const jwtToken = localStorage.getItem('token');

    const response = await fetch('http://localhost:8080/api/profile/image', {
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
    console.log(data.imageUrl);
    return data.imageUrl; // サーバーのレスポンスに合わせてプロパティを調整する
  };

  // 画像アップロードハンドラー
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      try {
        // サーバーにアップロードし、画像のURLを取得
        const imageUrl = await uploadImage(event.target.files[0]);
        // 状態を更新
        setProfileImage(imageUrl);
        // 画像のURLをプロファイルデータに追加して保存処理を実行
        handleChange('profile_image', imageUrl);
      } catch (error) {
        console.error('画像のアップロード中にエラーが発生しました:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダーの追加 */}
      <Header />

      <main className="p-6 md:p-20">
        <div className="max-w-4xl mx-auto">

          {/* アカウント画像登録フォーム */}
          <div className="mb-10 flex flex-col items-center">
            <label className="w-48 h-48 rounded-full overflow-hidden bg-gray-200 flex justify-center items-center cursor-pointer">
              {profileImage ? (
                <img
                  src={`http://localhost:8080/${profileImage}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <MdFileUpload size={80} className="text-gray-500" />
              )}
              <input type="file" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>


          {/* アカウント名とユーザー名 */}
          <div className="mb-4 md:flex space-y-4 md:space-y-0 md:space-x-4">
            <div className="md:flex-1">
              <div className="flex items-center">
                <div className="w-10 flex justify-center items-center">
                  <MdPerson size={32} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="本名"
                  value={fullName}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  // onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="md:flex-1">
              <div className="flex items-center">
                <div className="w-10 flex justify-center items-center">
                  <MdPerson size={32} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="ユーザー名"
                  value={username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  // onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 連絡先メールアドレス登録欄 */}
          <div className="mb-4 flex items-center">
            <div className="w-10 flex justify-center items-center">
              <MdEmail size={27} className="text-gray-500" />
            </div>
            <input
              type="email"
              placeholder="連絡先メールアドレス"
              value={contactEmail}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* SNSアカウントのURL登録 */}
          <div className="mb-4">

            {/* Github登録欄 */}
            <div className="flex items-center mb-2">
              <div className="w-10 flex justify-center items-center">
                <FaGithub size={25} className="text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="GitHub URL"
                value={snsUrls.github_url}
                onChange={(e) => handleChange('github_url', e.target.value)}
                className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Twitter登録欄 */}
            <div className="flex items-center mb-2">
              <div className="w-10 flex justify-center items-center">
                <FaTwitter size={25} className="text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Twitter URL"
                value={snsUrls.twitter_url}
                onChange={(e) => handleChange('twitter_url', e.target.value)}
                className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* YouTube登録欄 */}
            <div className="flex items-center mb-2">
              <div className="w-10 flex justify-center items-center">
                <FaYoutube size={27} className="text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="YouTube URL"
                value={snsUrls.youtube_url}
                onChange={(e) => handleChange('youtube_url', e.target.value)}
                className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* TikTok登録欄 */}
            <div className="flex items-center mb-2">
              <div className="w-10 flex justify-center items-center">
                <FaTiktok size={25} className="text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="TikTok URL"
                value={snsUrls.tiktok_url}
                onChange={(e) => handleChange('tiktok_url', e.target.value)}
                className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Instagram登録欄 */}
            <div className="flex items-center mb-2">
              <div className="w-10 flex justify-center items-center">
                <FaInstagram size={25} className="text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Instagram URL"
                value={snsUrls.instagram_url}
                onChange={(e) => handleChange('instagram_url', e.target.value)}
                className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 本文（経歴など）の登録欄 */}
          <div className="mb-4 flex">
            <div className="w-10 flex justify-center items-start">
              <MdWork size={24} className="text-gray-500" />
            </div>
            <textarea
              placeholder="経歴、自己紹介など"
              value={bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              className="flex-1 bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
              style={{ minHeight: '150px', resize: 'none' }}
            />
          </div>
        </div>
      </main>

    </div>
  );
};

export default AccountCreation;
