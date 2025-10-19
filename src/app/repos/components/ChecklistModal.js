'use client';

import { useState } from 'react';

export default function ChecklistModal({ isOpen, onClose, checklist, repository, analysis }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsExpanded(false);
    onClose();
  };

  const handleCopyChecklist = () => {
    navigator.clipboard.writeText(checklist);
    // You could add a toast notification here
    alert('Checklist copied to clipboard!');
  };

  const handleDownloadChecklist = () => {
    const blob = new Blob([checklist], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repository.name}-improvement-checklist.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                  Improvement Checklist
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {repository.name} • {repository.description || 'No description'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>⭐ {repository.stars} stars</span>
                  <span>🍴 {repository.forks} forks</span>
                  <span>💻 {repository.language || 'Unknown'}</span>
                </div>
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

          {/* Analysis Summary */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Repository Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${analysis.hasReadme ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {analysis.hasReadme ? '✓' : '✗'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">README</p>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${analysis.hasLicense ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {analysis.hasLicense ? '✓' : '✗'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">License</p>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${analysis.hasTests ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {analysis.hasTests ? '✓' : '✗'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Tests</p>
              </div>
              <div className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${analysis.hasCI ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {analysis.hasCI ? '✓' : '✗'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">CI/CD</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              <p><strong>Languages:</strong> {analysis.languages.join(', ') || 'None detected'}</p>
              <p><strong>Files:</strong> {analysis.fileCount} files</p>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[50vh] overflow-y-auto">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div 
                className="markdown-content"
                dangerouslySetInnerHTML={{ 
                  __html: checklist
                    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
                    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-6">$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
                    .replace(/^- \[ \] (.*$)/gim, '<div class="flex items-start mb-2"><input type="checkbox" class="mt-1 mr-3" disabled> <span>$1</span></div>')
                    .replace(/^- \[x\] (.*$)/gim, '<div class="flex items-start mb-2"><input type="checkbox" class="mt-1 mr-3" checked disabled> <span class="line-through">$1</span></div>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/^(?!<[h|d|i])/gm, '<p>')
                    .replace(/(?<!>)$/gm, '</p>')
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Generated checklist for {repository.name}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyChecklist}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Copy
                </button>
                <button
                  onClick={handleDownloadChecklist}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Download
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
