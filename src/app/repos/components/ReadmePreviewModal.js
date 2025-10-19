'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import 'github-markdown-css/github-markdown.css';
import 'highlight.js/styles/github.css';

export default function ReadmePreviewModal({
  isOpen,
  onClose,
  content,
  onAccept,
  onDecline,
  onRegenerate,
  regenerating = false,
  repoName,
  repoOwner,
}) {
  if (!isOpen) return null;

  const fileName = useMemo(() => `${repoName || 'repository'}-README.md`, [repoName]);

  const computeLinkHref = (href) => {
    if (!href) return href;
    // anchors or absolute links
    if (href.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(href)) return href;
    if (!repoOwner || !repoName) return href; // can't resolve without context
    // absolute path within repo
    if (href.startsWith('/')) {
      return `https://github.com/${repoOwner}/${repoName}/blob/HEAD${href}`;
    }
    // relative path within repo
    return `https://github.com/${repoOwner}/${repoName}/blob/HEAD/${href}`;
  };

  const computeImageSrc = (src) => {
    if (!src) return src;
    if (/^https?:\/\//i.test(src)) return src;
    if (!repoOwner || !repoName) return src;
    // absolute path within repo
    if (src.startsWith('/')) {
      return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/HEAD${src}`;
    }
    // relative path within repo
    return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/HEAD/${src}`;
  };

  const handleDownload = () => {
    const blob = new Blob([content || ''], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">README Preview</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Review the generated README and choose an action</p>
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
            <button onClick={handleDownload} className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">Download</button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="markdown-body p-8 rounded-lg border border-gray-600">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                components={{
                  a: ({href, children}) => (
                    <a href={computeLinkHref(href)} target="_blank" rel="noopener noreferrer">{children}</a>
                  ),
                  img: ({src, alt}) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={computeImageSrc(src)} alt={alt || ''} className="max-w-full" />
                  ),
                }}
              >
                {content || 'No content available.'}
              </ReactMarkdown>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
            <button
              onClick={onDecline}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              Decline
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onRegenerate}
                disabled={regenerating}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  regenerating
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700'
                }`}
              >
                {regenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Regenerating...
                  </div>
                ) : (
                  'Regenerate'
                )}
              </button>
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
