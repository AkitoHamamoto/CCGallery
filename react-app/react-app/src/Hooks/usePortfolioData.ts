// usePortfolioData.ts

import { useState, useEffect } from 'react';
import { Portfolio } from '../types/types'; // 適切な型定義をインポート

// 戻り値の型を定義
interface UsePortfolioDataReturn {
  portfolio: Portfolio | null;
  error: Error | null;
}

const usePortfolioData = (portfolioId: string | null): UsePortfolioDataReturn => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!portfolioId) return; // portfolioIdが空の場合は処理を行わない

    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/portfolio/portfolio?id=${portfolioId}`);
        if (!response.ok) {
          throw new Error('Portfolio data fetch failed');
        }
        const data: Portfolio = await response.json();
        setPortfolio(data);
      } catch (error) {
        setError(error as Error);
      }
    };

    fetchPortfolio();
  }, [portfolioId]);

  // 戻り値としてportfolioとerrorの両方を返す
  return { portfolio, error };
};

export default usePortfolioData;
