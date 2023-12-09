// useUserPortfolios.ts

import { useState, useEffect } from 'react';
import { Portfolio } from '../types/types';

// user_uuidを引数として受け取る
const useUserPortfolios = (userUUID: string) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  useEffect(() => {
    const fetchUserPortfolios = async () => {
      try {
        // user_uuidをクエリパラメータとして追加
        const response = await fetch(`http://localhost:8080/api/portfolios/user?id=${userUUID}`);

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setPortfolios(data.map((item: any) => ({
          portfolio_uuid: item.portfolio_uuid,
          title: item.title,
          image: item.thumbnail,
          subtitle: item.subtitle,
          status: item.status,
          tags: item.tags.split(',').map((tag: string) => tag.trim()),
        })));
      } catch (error) {
        console.error('Failed to fetch user portfolios:', error);
      }
    };

    // userUUIDが存在する場合のみfetchを実行する
    if (userUUID) {
      fetchUserPortfolios();
    }
  }, [userUUID]); // userUUIDが変更された時にのみ実行

  return portfolios;
};

export default useUserPortfolios;
