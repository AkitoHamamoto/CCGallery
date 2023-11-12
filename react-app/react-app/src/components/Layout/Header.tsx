import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      <h1 className="text-xl font-bold text-gray-900">CCGallery</h1>
      <input
        type="search"
        placeholder="Search..."
        className="border-2 border-gray-300 bg-white h-10 px-5 pr-10 rounded-full text-sm focus:outline-none"
      />
    </header>
  );
};

export default Header;
