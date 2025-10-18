"use client";

export default function FilterButton({ 
  label, 
  value, 
  isActive, 
  onClick, 
  count = null,
  icon = null 
}) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${isActive 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
        }
      `}
    >
      {icon && (
        <span className="text-sm">
          {icon}
        </span>
      )}
      <span>{label}</span>
      {count !== null && (
        <span className={`
          px-2 py-1 text-xs rounded-full
          ${isActive 
            ? 'bg-white/20 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }
        `}>
          {count}
        </span>
      )}
    </button>
  );
}
