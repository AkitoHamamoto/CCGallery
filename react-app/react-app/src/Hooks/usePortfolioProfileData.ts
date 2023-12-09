// usePortfolioProfileData.ts

import { useState, useEffect } from 'react';
import { ProfileData } from '../types/types';  // 型定義をインポート

const usePortfolioProfileData = (portfolioUUID: string): ProfileData | null => {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!portfolioUUID) return; // portfolioUUIDが空文字列の場合はデータの取得を行わない

    const fetchPortfolioProfileData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/profile/portfolio?id=${portfolioUUID}`);
        if (!response.ok) {
          throw new Error('Portfolio profile data fetch failed');
        }
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch portfolio profile data:', error);
      }
    };

    fetchPortfolioProfileData();
  }, [portfolioUUID]);

  return profile;
};

export default usePortfolioProfileData;
