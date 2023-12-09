// eventHandlers.ts


import { useNavigate } from 'react-router-dom';
import React from 'react'; // Reactの型を使用するためにインポート

export const useEventHandlers = () => {
  const navigate = useNavigate();

  // ポートフォリオ記事を表示
  const handlePortfolioClick = (portfolio_uuid: string) => {
    navigate(`/show?id=${portfolio_uuid}`);
  };

  // ポートフォリオ記事を表示
  const handlePortfolioUuidClick = (portfolio_uuid: string) => {
    navigate(`/portfolio?id=${portfolio_uuid}`); // ここでナビゲート処理を行う
  };

  // ユーザー情報更新画面
  const handleUserClick = () => {
    navigate('/user');
  };

  // ポートフォリオ記事を編集更新画面を表示
  const handleEditIconClick = (event: React.MouseEvent<HTMLElement>, portfolio_uuid: string) => {
    event.stopPropagation();
    navigate(`/create?id=${portfolio_uuid}`);
  };


  return {
    handlePortfolioClick,
    handleUserClick,
    handleEditIconClick,
    handlePortfolioUuidClick,
  };
};
