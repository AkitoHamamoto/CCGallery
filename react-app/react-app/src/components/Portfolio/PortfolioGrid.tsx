import React from 'react';
import PortfolioItem from './PortfolioItem';

// 仮のデータ型
type PortfolioData = {
  id: number;
  title: string;
  image: string;
};

interface PortfolioGridProps {
  items: PortfolioData[];
}

const PortfolioGrid: React.FC<PortfolioGridProps> = ({ items }) => {
  return (
    <div>
      {items.map((item) => (
        <PortfolioItem key={item.id} {...item} />
      ))}
    </div>
  );
};

export default PortfolioGrid;
