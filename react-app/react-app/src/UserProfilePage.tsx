// UserProfilePage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventHandlers } from './Handlers/eventHandlers';
import Header from './components/Layout/Header';
import useUserProfileData from './Hooks/useUserProfileData';
import useUserPortfolios from './Hooks/useUserPortfolios';
import SnsIcon from './components/UI/SnsIcon';

const UserProfilePage: React.FC = () => {
  // URLからuseridを取得
  const { userId } = useParams();

  // URlから限定公開用のパスを取得
  const urlParams = new URLSearchParams(window.location.search);
  const pass = urlParams.get('pass');

  // カスタムフックを使用して他のユーザーのプロフィールデータを取得する
  const ProfileData = useUserProfileData(userId ?? '');
  const Portfolios = useUserPortfolios(userId ?? '');

  const [isValidPass, setIsValidPass] = useState(false);
  const { handlePortfolioUuidClick } = useEventHandlers();

  useEffect(() => {
    const validatePass = async () => {
      if (pass) {
        try {
          const response = await fetch(`http://localhost:8080/api/validate-uuid?pass=${pass}`);
          if (response.ok) {
            setIsValidPass(true);
          } else {
            setIsValidPass(false);
          }
        } catch (error) {
          console.error('Error validating pass:', error);
          setIsValidPass(false);
        }
      }
    };

    validatePass();
  }, [pass]);

  // プロフィールデータがまだ取得されていない場合はローディング表示
  if (!ProfileData) {
    return <div>Loading...</div>;
  }

  const visiblePortfolios = Portfolios.filter(portfolio =>
    portfolio.status === '1' || (isValidPass && portfolio.status === '2')
  );

  // プロフィールデータを表示
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
              className="mx-auto w-32 h-32 rounded-full object-cover"
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
      <main className="p-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* カードを生成 */}
          {visiblePortfolios.map((Portfolio) => (
            <div
              key={Portfolio.portfolio_uuid}
              className="relative flex flex-col bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer"
              onClick={() => handlePortfolioUuidClick(Portfolio.portfolio_uuid)}
            >
              {/* 画像 */}
              <div className="flex-grow">
                <img
                  // src={Portfolio.image ? `http://localhost:8080/${Portfolio.image}` : 'http://localhost:3000/images/thumbnail.png'}
                  src={`http://localhost:8080/${Portfolio.image}`}
                  alt={Portfolio.title}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              {/* タイトル、サブタイトル、タグのコンテナ */}
              <div className="p-5 mt-auto">
                <h2 className="text-lg font-bold">
                  {Portfolio.title}
                </h2>
                <p className="text-gray-700">{Portfolio.subtitle}</p>
                <div className="mt-2">
                  {Portfolio.tags.map((tag, index) => (
                    <span key={index} className={`tag-${tag} text-xs font-semibold inline-block py-1 px-2.5 rounded text-white bg-blue-600 mr-2`}>
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

export default UserProfilePage;

