// useUserProfileData.ts

import { useState, useEffect } from 'react';
import { ProfileData } from '../types/types';  // 型定義をインポート

const useUserProfileData = (userUUID: string): ProfileData | null => {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!userUUID) return; // userUUIDが空文字列の場合はデータの取得を行わない

    const fetchOtherUserProfileData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/profile/user?id=${userUUID}`);
        if (!response.ok) {
          throw new Error('Other user profile data fetch failed');
        }
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch other user profile data:', error);
      }
    };

    if (userUUID) {
      fetchOtherUserProfileData();
    }
  }, [userUUID]);

  return profile;
};

export default useUserProfileData;
