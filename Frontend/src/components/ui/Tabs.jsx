import React from 'react';
import { cn } from '../../lib/utils';

const Tabs = ({ tabs = [], activeTab = undefined, onChange = undefined, className = '', size = 'md' }) => {
  const sizes = {
    sm: 'text-xs py-2 px-3',
    md: 'text-sm py-2.5 px-4',
    lg: 'text-sm py-3 px-5',
  };

  return (
    <div
      className={cn('flex border-b border-gray-200', className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 font-medium border-b-2 -mb-px transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
              'cursor-pointer select-none whitespace-nowrap',
              sizes[size],
              isActive
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-0.5 leading-none',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
