import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

interface SearchBarProps {
  onSearch?: () => void; 
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?term=${encodeURIComponent(searchTerm.trim())}`);
      // setSearchTerm(''); // Keep search term for now, user might want to refine
      if (onSearch) {
        onSearch();
      }
    }
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className} w-full max-w-xs lg:max-w-md`}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar..." 
        className="w-full pl-10 pr-4 py-2 text-sm text-text-primary bg-card rounded-lg focus:ring-2 focus:ring-primary-action focus:border-transparent outline-none placeholder-text-secondary"
      />
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
        <FaSearch />
      </div>
      {/* Optional: Filter button if needed later, as in the image */}
      {/* <button
        type="button" // Or 'submit' if it performs search
        className="absolute right-0 top-0 h-full px-3 text-text-secondary hover:text-primary transition-colors"
        aria-label="Filter search options"
      >
        <FaFilter /> 
      </button> */}
    </form>
  );
};

export default SearchBar;