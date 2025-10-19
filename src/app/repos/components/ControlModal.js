'use client';

import { useState } from 'react';
import ActionCard from './ActionCard';
import ChecklistModal from './ChecklistModal';
import { useAuth } from '../../../contexts/AuthContext';

export default function ControlModal({ isOpen, onClose, repo }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checklistData, setChecklistData] = useState(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const { token } = useAuth();

  if (!isOpen) return null;

  const polishActions = [
    {
      id: 'readme',
      title: 'Generate README',
      description: 'Create a comprehensive README with project overview, installation, and usage instructions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700'
    },
    {
      id: 'documentation',
      title: 'Add Documentation',
      description: 'Generate comprehensive documentation for functions, classes, and API endpoints',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    {
      id: 'code-quality',
      title: 'Improve Code Quality',
      description: 'Add linting, formatting, and code quality improvements',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700'
    },
    {
      id: 'gitignore',
      title: 'Add .gitignore',
      description: 'Generate appropriate .gitignore file for your project type',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
      ),
      color: 'from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700'
    },
    {
      id: 'checklist',
      title: 'Improvement Checklist',
      description: 'Generate a high-level checklist to systematically improve your repository',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'from-indigo-500 to-indigo-600',
      hoverColor: 'hover:from-indigo-600 hover:to-indigo-700'
    },
    {
      id: 'contributing',
      title: 'Add Contributing Guide',
      description: 'Create guidelines for contributors and development workflow',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-pink-500 to-pink-600',
      hoverColor: 'hover:from-pink-600 hover:to-pink-700'
    }
  ];

  const handleActionSelect = (actionId) => {
    setSelectedAction(actionId);
  };

  const handleExecute = async () => {
    if (!selectedAction) return;
    
    setIsProcessing(true);
    
    try {
      if (selectedAction === 'checklist') {
        // Call the checklist generation API
        const response = await fetch('/api/checklist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            githubtoken: token,
            repo: repo.name,
            owner: repo.owner.login
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to generate checklist: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Generated checklist:', data);
        
        // Store the checklist data and show the modal
        setChecklistData(data);
        setShowChecklistModal(true);
      } else {
        // Handle other actions (existing logic)
        console.log(`Executing ${selectedAction} for repo:`, repo.name);
        
        // Simulate processing for other actions
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('Error executing action:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedAction(null);
    setIsProcessing(false);
    setChecklistData(null);
    setShowChecklistModal(false);
    onClose();
  };

  const handleChecklistModalClose = () => {
    setShowChecklistModal(false);
    setChecklistData(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Polish Repository
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {repo?.name} • Choose an action to improve your repository
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {polishActions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  isSelected={selectedAction === action.id}
                  onSelect={handleActionSelect}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedAction ? (
                  <span>Selected: <span className="font-medium text-gray-700 dark:text-gray-300">
                    {polishActions.find(a => a.id === selectedAction)?.title}
                  </span></span>
                ) : (
                  'Select an action to continue'
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecute}
                  disabled={!selectedAction || isProcessing}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedAction && !isProcessing
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    'Execute Action'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Modal */}
      {checklistData && (
        <ChecklistModal
          isOpen={showChecklistModal}
          onClose={handleChecklistModalClose}
          checklist={checklistData.checklist}
          repository={checklistData.repository}
          analysis={checklistData.analysis}
        />
      )}
    </div>
  );
}
