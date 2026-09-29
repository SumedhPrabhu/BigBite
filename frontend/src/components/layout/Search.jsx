import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Search = () => {
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      setKeyword("");
    }
  }, [location.pathname]);

  const searchHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/eats/stores/search/${encodeURIComponent(keyword.trim())}`);
    } else {
      navigate("/");
    }
  };

  return (
    <form onSubmit={searchHandler} className="w-full">
      <div className="relative flex items-center w-full">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          type="text"
          id="search_field"
          className="w-full pl-10 pr-24 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
          placeholder="Search restaurants, dishes, cuisines..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        {/* Clear input button if typed */}
        {keyword && (
          <button
            type="button"
            onClick={() => setKeyword("")}
            className="absolute right-20 text-gray-400 hover:text-gray-600 text-xs p-1"
          >
            ✕
          </button>
        )}

        <button
          type="submit"
          id="search_btn"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 flex items-center space-x-1"
        >
          <span>Search</span>
        </button>
      </div>
    </form>
  );
};

export default Search;
