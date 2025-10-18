"use client";
import { useState, useEffect, useRef } from "react";
import FilterButton from "./FilterButton";

export default function FilterBar({ 
  visibilityFilter, 
  ownerFilter, 
  onVisibilityChange, 
  onOwnerChange,
  repos = []
}) {
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOwnerDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Calculate counts for each filter option
  const getVisibilityCounts = () => {
    const counts = { all: repos.length, public: 0, private: 0 };
    repos.forEach(repo => {
      if (repo.visibility === 'public') counts.public++;
      if (repo.visibility === 'private') counts.private++;
    });
    return counts;
  };

  const getOwnerCounts = () => {
    const counts = { all: repos.length };
    const ownerMap = new Map();
    const ownerAvatars = new Map();
    
    repos.forEach(repo => {
      const ownerKey = repo.owner.login;
      if (ownerMap.has(ownerKey)) {
        ownerMap.set(ownerKey, ownerMap.get(ownerKey) + 1);
      } else {
        ownerMap.set(ownerKey, 1);
        ownerAvatars.set(ownerKey, repo.owner.avatar_url);
      }
    });
    
    // Convert to object with owner names as keys
    const ownerCounts = Object.fromEntries(ownerMap);
    
    return { 
      ...counts, 
      ...ownerCounts, 
      owners: Array.from(ownerMap.keys()).sort(),
      avatars: Object.fromEntries(ownerAvatars)
    };
  };

  const visibilityCounts = getVisibilityCounts();
  const ownerCounts = getOwnerCounts();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Visibility Filter */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Visibility
          </h3>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              label="All"
              value="all"
              isActive={visibilityFilter === 'all'}
              onClick={onVisibilityChange}
              count={visibilityCounts.all}
            />
            <FilterButton
              label="Public"
              value="public"
              isActive={visibilityFilter === 'public'}
              onClick={onVisibilityChange}
              count={visibilityCounts.public}
              icon="🌐"
            />
            <FilterButton
              label="Private"
              value="private"
              isActive={visibilityFilter === 'private'}
              onClick={onVisibilityChange}
              count={visibilityCounts.private}
              icon="🔒"
            />
          </div>
        </div>

        {/* Owner Filter */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Repository Owners
          </h3>
          <div className="relative" ref={dropdownRef}>
            {/* Custom dropdown button */}
            <button
              type="button"
              onClick={() => setIsOwnerDropdownOpen(!isOwnerDropdownOpen)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {ownerFilter === 'all' ? (
                  <>
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">

                    </div>
                    <span>All Owners ({ownerCounts.all})</span>
                  </>
                ) : (
                  <>
                    <img
                      src={ownerCounts.avatars[ownerFilter]}
                      alt={ownerFilter}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-6 h-6 bg-gray-400 rounded-full items-center justify-center hidden">
                      <span className="text-white text-xs font-bold">{ownerFilter.charAt(0).toUpperCase()}</span>
                    </div>
                    <span>{ownerFilter} ({ownerCounts[ownerFilter]})</span>
                  </>
                )}
              </div>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform ${isOwnerDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isOwnerDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {/* All option */}
                <button
                  onClick={() => {
                    onOwnerChange('all');
                    setIsOwnerDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  </div>
                  <span className="text-gray-900 dark:text-white">All Owners ({ownerCounts.all})</span>
                </button>

                {/* Owner options */}
                {ownerCounts.owners.map(owner => (
                  <button
                    key={owner}
                    onClick={() => {
                      onOwnerChange(owner);
                      setIsOwnerDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  >
                    <img
                      src={ownerCounts.avatars[owner]}
                      alt={owner}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-6 h-6 bg-gray-400 rounded-full items-center justify-center hidden">
                      <span className="text-white text-xs font-bold">{owner.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-gray-900 dark:text-white">{owner} ({ownerCounts[owner]})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {repos.length} repositories
          {visibilityFilter !== 'all' && ` • ${visibilityFilter} repositories`}
          {ownerFilter !== 'all' && ` • owned by ${ownerFilter}`}
        </p>
      </div>
    </div>
  );
}
