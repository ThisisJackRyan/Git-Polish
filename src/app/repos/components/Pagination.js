"use client";

export default function Pagination({ pagination, onPageChange }) {
    const { currentPage, totalPages, totalRepos, perPage, hasNextPage, hasPrevPage } = pagination;

    if (totalPages <= 1) {
        return null;
    }

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            // Show all pages if total pages is less than max visible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show pages with ellipsis
            if (currentPage <= 3) {
                // Show first 4 pages + ellipsis + last page
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                // Show first page + ellipsis + last 4 pages
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    const startItem = (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, totalRepos);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            {/* Results info */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startItem} to {endItem} of {totalRepos} repositories
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        hasPrevPage
                            ? 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            : 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-not-allowed'
                    }`}
                >
                    Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === 'number' && onPageChange(page)}
                            disabled={page === '...'}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                page === currentPage
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                    : page === '...'
                                    ? 'text-gray-400 dark:text-gray-600 cursor-default'
                                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                {/* Next button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        hasNextPage
                            ? 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            : 'text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-not-allowed'
                    }`}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
