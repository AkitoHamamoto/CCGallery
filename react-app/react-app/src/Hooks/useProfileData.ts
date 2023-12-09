// useProfileData.ts

import { useState, useEffect } from 'react';
import { ProfileData } from '../types/types';  // 型定義をインポート

const useProfileData = (): ProfileData | null => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      // JWTトークンをローカルストレージから取得
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      try {
        const response = await fetch('http://localhost:8080/api/profile', { headers });
        if (!response.ok) {
          throw new Error('Profile data fetch failed');
        }
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      }
    };

    fetchProfileData();
  }, []);

  return profile;
};

export default useProfileData;
