
export default function DescriptionModal({ isOpen, onClose, content, onAccept }) {
    if (!isOpen){
        return null;
    }

    const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content || '');
    } catch (e) {
      console.error('Copy failed', e);
    }
  };
    return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Description Preview</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Review the generated Description and choose an action</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <button onClick={handleCopy} className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">Copy</button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto">
            <div className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                {content}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              Decline
            </button>
            <div className="flex items-center">  
              <button
                onClick={onAccept}
                className="px-6 py-2 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}