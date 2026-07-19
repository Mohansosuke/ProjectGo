import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';

const Breadcrumb = ({ items = [], className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
              )}

              {item.href && !isLast ? (
                <a
                  href={item.href}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                    }
                  }}
                  className="text-slate-500 hover:text-slate-700 font-medium transition-colors"
                >
                  {item.icon && (
                    <item.icon className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                  )}
                  {item.label}
                </a>
              ) : (
                <span
                  className={cn(
                    'font-semibold',
                    isLast ? 'text-slate-800' : 'text-slate-500'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && (
                    <item.icon className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                  )}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
