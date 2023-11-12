import React, { useState } from 'react';
import Header from './components/Layout/Header';
import { MdFileUpload, MdPerson, MdEmail, MdWork } from 'react-icons/md';
import { FaTwitter, FaGithub, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';


const AccountCreation: React.FC = () => {
  const [profileImage, setProfileImage] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [bio, setBio] = useState('');
  const [snsUrls, setSnsUrls] = useState({
    twitter: '',
    github: '',
    instagram: '',
    youtube: '',
    tiktok: ''
  });

  // 画像アップロードハンドラー
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        if (e.target) {
          setProfileImage(e.target.result as string);
        }
      };
      fileReader.readAsDataURL(event.target.files[0]);
    }
  };

  // SNS URL変更ハンドラー
  const handleSnsUrlChange = (sns: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSnsUrls({ ...snsUrls, [sns]: event.target.value });
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
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
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
                  onChange={(e) => setFullName(e.target.value)}
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
                  onChange={(e) => setUsername(e.target.value)}
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
              onChange={(e) => setContactEmail(e.target.value)}
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
                value={snsUrls.github}
                onChange={handleSnsUrlChange('github')}
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
                value={snsUrls.twitter}
                onChange={handleSnsUrlChange('twitter')}
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
                value={snsUrls.youtube}
                onChange={handleSnsUrlChange('youtube')}
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
                value={snsUrls.tiktok}
                onChange={handleSnsUrlChange('tiktok')}
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
                value={snsUrls.instagram}
                onChange={handleSnsUrlChange('instagram')}
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
              onChange={(e) => setBio(e.target.value)}
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
