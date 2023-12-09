// usePortfolios.ts

import { useState, useEffect } from 'react';
import { Portfolio } from '../types/types';


const usePortfolios = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/api/portfolios', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
        console.error('Failed to fetch portfolios:', error);
      }
    };

    fetchPortfolios();
  }, []);

  return portfolios;
};

export default usePortfolios;
