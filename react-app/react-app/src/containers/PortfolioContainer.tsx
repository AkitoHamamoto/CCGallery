import React, { useState, useEffect } from 'react';
import PortfolioGrid from '../components/Portfolio/PortfolioGrid';
import { PortfolioItem } from '../types/portfolio';

// 仮のデータフェッチ関数
const fetchPortfolioItems = (): Promise<PortfolioItem[]> => {
  // APIからデータを取得するロジックを実装
  return Promise.resolve([]);
};

const PortfolioContainer: React.FC = () => {
  // useStateにPortfolioItem型の配列を指定
  const [items, setItems] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    fetchPortfolioItems().then(data => setItems(data));
  }, []);

  return <PortfolioGrid items={items} />;
};

export default PortfolioContainer;
