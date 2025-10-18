"use client";
import { useEffect, useState, useMemo } from "react";
import RepoBlock from "./components/RepoBlock";
import ControlModal from "./components/ControlModal";
import FilterBar from "./components/FilterBar";
import Pagination from "./components/Pagination";
import { useAuth } from '../../contexts/AuthContext';

export default function Repos() {
    const { user, token, loading } = useAuth();

    const [repos, setRepos] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRepos: 0,
        perPage: 30,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [apiLoading, setApiLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState(null);
    
    // Filter states
    const [visibilityFilter, setVisibilityFilter] = useState('all');
    const [ownerFilter, setOwnerFilter] = useState('all');


    // Function to fetch repositories with pagination
    const fetchRepos = async (page = 1, perPage = 30) => {
        setApiLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`/api/github/repos?token=${token}&page=${page}&per_page=${perPage}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch repositories');
            }
            
            const data = await response.json();
            setRepos(data.repos);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Error fetching repos:', err);
            setError(err.message);
        } finally {
            setApiLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && token) {
            fetchRepos(1, 30);
        }
    }, [loading, token]);

    // Handle page changes
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchRepos(newPage, pagination.perPage);
        }
    };

    const handlePolishClick = (repo) => {
        setSelectedRepo(repo);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedRepo(null);
    };

    // Filter repositories based on current filter states
    const filteredRepos = useMemo(() => {
        return repos.filter(repo => {
            const visibilityMatch = visibilityFilter === 'all' || repo.visibility === visibilityFilter;
            const ownerMatch = ownerFilter === 'all' || repo.owner.login === ownerFilter;
            return visibilityMatch && ownerMatch;
        });
    }, [repos, visibilityFilter, ownerFilter]);

    // Filter change handlers
    const handleVisibilityChange = (value) => {
        setVisibilityFilter(value);
    };

    const handleOwnerChange = (value) => {
        setOwnerFilter(value);
    };


    if (apiLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                My GitHub
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {' '}Repositories
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Select a repository to polish and transform it into a professional, well-organized codebase.
              </p>
            </div>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading your repositories...</p>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Repositories</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                My GitHub
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {' '}Repositories
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Select a repository to polish and transform it into a professional, well-organized codebase.
              </p>
            </div>

            {/* Filter Bar */}
            {repos.length > 0 && (
              <FilterBar
                visibilityFilter={visibilityFilter}
                ownerFilter={ownerFilter}
                onVisibilityChange={handleVisibilityChange}
                onOwnerChange={handleOwnerChange}
                repos={repos}
              />
            )}

            {/* Repositories Grid */}
            {filteredRepos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredRepos.map(repo => (
                    <RepoBlock key={repo.id} repo={repo} onPolishClick={handlePolishClick} />
                  ))}
                </div>
                
                {/* Pagination */}
                <Pagination 
                  pagination={pagination} 
                  onPageChange={handlePageChange} 
                />
              </>
            ) : repos.length > 0 ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Repositories Match Your Filters</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Try adjusting your visibility or owner type filters to see more repositories.
                </p>
                <button
                  onClick={() => {
                    setVisibilityFilter('all');
                    setOwnerFilter('all');
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Repositories Found</h2>
                <p className="text-gray-600 dark:text-gray-300">It looks like you don't have any repositories yet.</p>
              </div>
            )}
          </div>
          
          {/* Control Modal */}
          <ControlModal 
            isOpen={isModalOpen}
            onClose={handleModalClose}
            repo={selectedRepo}
          />
        </div>
    );
}