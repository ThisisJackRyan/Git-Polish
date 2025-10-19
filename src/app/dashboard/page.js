'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [githubUsername, setGithubUsername] = useState(null);
  const [githubUserLoading, setGithubUserLoading] = useState(false);

  const fetchGitHubUsername = async () => {
    if (!token) return;
    
    setGithubUserLoading(true);
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        const githubUser = await response.json();
        setGithubUsername(githubUser.login);
      } else {
        console.error('Failed to fetch GitHub user:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching GitHub username:', error);
    } finally {
      setGithubUserLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && token) {
      fetchGitHubUsername();
    }
  }, [user, token]);

  if (loading) {
    return (
      <div className="min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 h-full">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-300">Please wait while we set up your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to home page
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}Git Polish
            </span>
            <br />
            <span className="text-2xl md:text-3xl font-medium text-gray-600 dark:text-gray-300">
              Dashboard
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Manage your GitHub repositories and polish them to perfection.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-2xl">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.displayName || 'User'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {user.email || 'No email provided'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="font-medium text-gray-700 dark:text-gray-300">GitHub Username</span>
                  {githubUserLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                      <span className="text-gray-500 dark:text-gray-400">Loading...</span>
                    </div>
                  ) : (
                    <span className="text-gray-900 dark:text-white">
                      {githubUsername ? (
                        <a 
                          href={`https://github.com/${githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                        >
                          @{githubUsername}
                        </a>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Not available</span>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="font-medium text-gray-700 dark:text-gray-300">User ID</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {user.uid}
                  </span>
                </div>
                <a
                href="/repos"
                className="group block w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-center"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  View Repositories
                </div>
              </a>
              </div>
              
            </div>
          </div>

          {/* Status Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 h-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Account Status
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 px-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Status</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-600 dark:text-green-400 font-medium">Authenticated</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Token</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {token ? `${token.substring(0, 12)}...` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => {
                    sessionStorage.removeItem('githubToken');
                    router.push('/');
                  }}
                  className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-300 dark:border-gray-600"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
