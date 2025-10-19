'use client';

import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import AuthButton from './AuthButton';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { signInWithGitHub } from '../app/services/firebase';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, setUser, setToken, mounted } = useAuth();
  const router = useRouter();

  const handleReposClick = async (e) => {
    // If triggered by an <a> tag, prevent navigation while we decide
    if (e && e.preventDefault) e.preventDefault();

    if (user) {
      router.push('/repos/');
      return;
    }

    // If not mounted yet, avoid starting auth flow
    if (!mounted) return;

    try {
      const result = await signInWithGitHub();
      // signInWithGitHub returns { user, token } in AuthButton; handle similarly if available
      if (result && result.user && result.token) {
        setUser(result.user);
        setToken(result.token);
        sessionStorage.setItem('githubToken', result.token);
        sessionStorage.setItem('githubUser', JSON.stringify(result.user));
      }
      // After sign in, go to repos
      router.push('/repos/');
    } catch (err) {
      console.error('GitHub sign-in from navigation failed:', err);
    }
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href='/'>
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                Git Polish
              </span>
            </div>
          </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="/#features"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
              >
                Features
              </a>
              <a
                href="/#how-it-works"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
              >
                How it Works
              </a>
              <a
                href="/repos/"
                onClick={handleReposClick}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors"
              >
                Repos
              </a>
            </div>
          </div>

          {/* Theme Toggle and Login Button */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <AuthButton />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:text-blue-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <a
                href="/#features"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="/#how-it-works"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                How it Works
              </a>
              <a
                href="/repos/"
                onClick={(e) => {
                  setIsMenuOpen(false);
                  handleReposClick(e);
                }}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 block px-3 py-2 text-base font-medium"
              >
                Repos
              </a>
              <div className="w-full mt-4">
                <AuthButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
