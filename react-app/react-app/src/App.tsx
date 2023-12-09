import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import CreatePage from './CreatePage';
import UserPage from './UserPage';
import ShowPage from './ShowPage';
import ApiPage from './ApiPage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import UserProfilePage from './UserProfilePage';
import UserPortfolioPage from './UserPortfolioPage';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/mypage" element={
                    <ProtectedRoute element={<AboutPage />} />
                } />
                <Route path="/create" element={
                    <ProtectedRoute element={<CreatePage />} />
                } />
                <Route path="/user" element={
                    <ProtectedRoute element={<UserPage />} />
                } />
                <Route path="/show" element={
                    <ProtectedRoute element={<ShowPage />} />
                } />
                <Route path="/profile/:userId" element={<UserProfilePage />} />
                <Route path="/portfolio" element={<UserPortfolioPage />} />
                <Route path="/api" element={<ApiPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Routes>
        </Router>
    );
};

export default App;
