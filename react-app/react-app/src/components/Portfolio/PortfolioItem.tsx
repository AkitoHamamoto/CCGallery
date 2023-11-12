import React from 'react';

interface PortfolioItemProps {
  title: string;
  image: string;
}

const PortfolioItem: React.FC<PortfolioItemProps> = ({ title, image }) => {
  return (
    <div>
      <img src={image} alt={title} />
      <h3>{title}</h3>
    </div>
  );
};

export default PortfolioItem;
