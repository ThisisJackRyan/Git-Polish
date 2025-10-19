'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ActionCard from './ActionCard';
import ChecklistModal from './ChecklistModal';
import ReadmePreviewModal from './ReadmePreviewModal';
import DescriptionModal from './DescriptionModal';


export default function ControlModal({ isOpen, onClose, repo }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checklistData, setChecklistData] = useState(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [error, setError] = useState(null);
  const [readmeContent, setReadmeContent] = useState('');
  const [showReadmePreview, setShowReadmePreview] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false)
  const [description, setDescription] = useState('')
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
      id: 'description',
      title: 'Generate and Update Description',
      description: 'Generate a short description based on your current Readme',
      icon: (
         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700'
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

  ];

  const handleActionSelect = (actionId) => {
    setSelectedAction(actionId);
  };

  async function callGenerateReadme() {
    const response = await fetch(`/api/github/repos/${repo.name}/readme?token=${token}&owner=${repo.owner.login}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Failed to generate README: ${response.statusText}`);
    }
    const data = await response.json();
    // Prefer summary or full data depending on backend
    const content = data?.summary || data?.data?.summary || JSON.stringify(data, null, 2);
    return content;
  }

  const handleExecute = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);

    try {
      if(selectedAction == 'description' ){
        const response = await fetch(`/api/github/repos/${repo.name}/description?token=${token}&owner=${repo.owner.login}`)
        const data = await response.json()
        setDescription(data.description)
        setShowDescriptionPreview(true)
      }
      else if (selectedAction === 'checklist') {
        console.log(repo)
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
        const data = await response.json();
        console.log('Generated checklist:', data);
        
        // Store the checklist data and show the modal
        
        setChecklistData(data);
        setShowChecklistModal(true);
      } else if (selectedAction === 'readme') {
        const content = await callGenerateReadme();
        setReadmeContent(content);
        setShowReadmePreview(true);
      } else {
        // TODO: Implement other actions
        console.log(`Executing ${selectedAction} for repo:`, repo.name);
      }
    } catch (err) {
      console.error('Error executing action:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
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
    setError(null);
    onClose();
  };

  const handleAcceptDescription = async () => {
    const resp = await fetch(`/api/github/repos/${repo.name}/description?token=${token}&owner=${repo.owner.login}`,
      {
        method: "PUT",
        body: JSON.stringify({
          description: description,
        }),
      }

    )
    if(resp.ok){
      alert("Description Updated ")
    }
    else{
      alert("Description NOT Updated ")
    }
    setShowDescriptionPreview(false);
    onClose();
  }

  const handleAcceptReadme = async () => {

    const resp = await fetch(`/api/github/repos/${repo.name}/readme?token=${token}&owner=${repo.owner.login}`, {
      method: "PUT",
      body: JSON.stringify({
        message: "Update ReadMe via Git Polish",
        content: btoa(readmeContent),
      }),
    })
    if(resp.ok){
      alert("README Updated ")
    }
    else{
      console.log(resp)
      alert("it did not")
    }
    setShowReadmePreview(false);
    onClose();
  };

  const handleDeclineReadme = () => {
    setShowReadmePreview(false);
  };

  const handleRegenerateReadme = async () => {
    setRegenerating(true);
    try {
      const content = await callGenerateReadme();
      setReadmeContent(content);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setRegenerating(false);
    }
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
            {error && (
              <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
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
      <ReadmePreviewModal
        isOpen={showReadmePreview}
        onClose={() => setShowReadmePreview(false)}
        content={readmeContent}
        repoName={repo?.name}
        repoOwner={repo?.owner?.login}
        onAccept={handleAcceptReadme}
        onDecline={handleDeclineReadme}
        onRegenerate={handleRegenerateReadme}
        regenerating={regenerating}
      />
      <DescriptionModal
        isOpen={showDescriptionPreview}
        onClose={() => setShowDescriptionPreview(false)}
        content={description}
        onAccept={handleAcceptDescription}
      />
    </div>
  );
}

