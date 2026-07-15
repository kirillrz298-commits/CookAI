import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="glass-effect rounded-3xl overflow-hidden shadow-md flex flex-col h-[420px] animate-pulse">
      {/* Recipe Image Skeleton */}
      <div className="h-52 w-full skeleton-shimmer" />
      
      {/* Content Skeleton */}
      <div className="p-5 flex flex-col justify-between flex-grow">
        <div>
          {/* Category & Cuisine Tags */}
          <div className="flex gap-2 mb-3">
            <div className="h-5 w-16 rounded-full skeleton-shimmer" />
            <div className="h-5 w-20 rounded-full skeleton-shimmer" />
          </div>
          
          {/* Title */}
          <div className="h-6 w-3/4 rounded-md mb-2 skeleton-shimmer" />
          {/* Description */}
          <div className="h-4 w-full rounded-md mb-2 skeleton-shimmer" />
          <div className="h-4 w-5/6 rounded-md skeleton-shimmer" />
        </div>

        <div>
          {/* Divider */}
          <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-800 my-4" />
          
          {/* Footer Stats */}
          <div className="flex justify-between items-center">
            <div className="h-5 w-12 rounded-md skeleton-shimmer" />
            <div className="h-5 w-16 rounded-md skeleton-shimmer" />
            <div className="h-5 w-14 rounded-md skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
};
