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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to home page
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to Git Polish Dashboard
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                User Information
              </h2>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {user.displayName || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {user.email || 'N/A'}</p>
                <p><span className="font-medium">GitHub Username:</span> 
                  {githubUserLoading ? (
                    <span className="text-gray-500 dark:text-gray-400 ml-2">Loading...</span>
                  ) : (
                    <span className="ml-2">
                      {githubUsername ? (
                        <a 
                          href={`https://github.com/${githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                        >
                          @{githubUsername}
                        </a>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </span>
                  )}
                </p>
                <p><span className="font-medium">GitHub UID:</span> {user.uid}</p>
                <p><span className="font-medium">Photo:</span> 
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full ml-2 inline-block"
                    />
                  )}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Authentication Status
              </h2>
              <div className="space-y-2">
                <p><span className="font-medium">Status:</span> 
                  <span className="text-green-600 dark:text-green-400 ml-2">✓ Authenticated</span>
                </p>
                <p><span className="font-medium">Token:</span> 
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {token ? `${token.substring(0, 20)}...` : 'N/A'}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={() => {
                sessionStorage.removeItem('githubToken');
                router.push('/');
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
