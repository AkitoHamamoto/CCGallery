// ErrorPage.tsx

import React from 'react';

interface ErrorPageProps {
  statusCode: number;
  message: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ statusCode, message }) => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h1 className="text-6xl font-bold">{statusCode}</h1>
      <p className="text-xl mt-4">{message}</p>
    </div>
  </div>
);

export default ErrorPage;
