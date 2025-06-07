'use client';

import React from 'react';
import Link from 'next/link';

interface ChapterCardProps {
  id: string;
  title: string;
  storylineId: number;
  summary: string;
  isRead?: boolean;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  id,
  title,
  storylineId,
  summary,
  isRead = false
}) => {
  // Определяем класс для цвета сюжетной линии
  const storylineClass = `storyline-${storylineId <= 3 ? storylineId : storylineId % 3 + 1}`;
  
  return (
    <Link href={`/chapters/${id}`} className="block">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
        {isRead && (
          <div className="chapter-read-indicator" title="Прочитано"></div>
        )}
        <div className={`inline-block px-2 py-1 rounded text-xs mb-2 ${storylineClass}`}>
          Сюжетная линия {storylineId}
        </div>
        <h3 className="text-lg font-medium mb-2 hover:text-accent-1 transition-colors">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{summary}</p>
      </div>
    </Link>
  );
};
