import React, { ReactElement, useEffect, useState } from 'react';
// import { Navigate } from 'react-router-dom';
import axios from 'axios';

const checkAuth = async (): Promise<boolean> => {
  try {
    const response = await axios.get('http://localhost:8080/api/auth', { withCredentials: true });
    console.log('Authentication check response:', response);
    return response.status === 200;
  } catch (error) {
    console.error('Authentication check error:', error);
    return false;
  }
};


interface ProtectedRouteProps {
  element: ReactElement; // ReactElement 型を使用しています
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const authStatus = await checkAuth();
      setIsAuthenticated(authStatus);
      setIsLoading(false);
    };

    verifyAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // 認証状態を確認するための表示
  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  // return isAuthenticated ? element : <Navigate to="/login" />;
  return <div>{`Authenticated: ${isAuthenticated}`}</div>;
};

export default ProtectedRoute;
