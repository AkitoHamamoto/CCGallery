import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import CreatePage from './CreatePage';
import UserPage from './UserPage';
import ShowPage from './ShowPage';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/create" element={<CreatePage />} />
                <Route path="/user" element={<UserPage />} />
                <Route path="/show" element={<ShowPage />} />
            </Routes>
        </Router>
    );
};

export default App;
