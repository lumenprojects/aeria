'use client';

import React from 'react';

interface ChapterReaderProps {
  title: string;
  content: string;
  chapterNumber: number;
  previousChapterId?: string;
  nextChapterId?: string;
}

export const ChapterReader: React.FC<ChapterReaderProps> = ({
  title,
  content,
  chapterNumber,
  previousChapterId,
  nextChapterId
}) => {
  return (
    <div className="reading-mode py-8">
      <div className="mb-8">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Глава {chapterNumber}</div>
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
        {previousChapterId ? (
          <a href={`/chapters/${previousChapterId}`} className="btn btn-secondary">
            &larr; Предыдущая глава
          </a>
        ) : (
          <div></div>
        )}
        
        {nextChapterId && (
          <a href={`/chapters/${nextChapterId}`} className="btn btn-primary">
            Следующая глава &rarr;
          </a>
        )}
      </div>
    </div>
  );
};
