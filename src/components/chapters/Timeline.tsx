'use client';

import React from 'react';
import Link from 'next/link';

interface TimelineItemProps {
  id: string;
  title: string;
  storylineId: number;
  position: number;
  isRead?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  id,
  title,
  storylineId,
  position,
  isRead = false
}) => {
  // Определяем класс для цвета сюжетной линии
  const storylineClass = `bg-accent-${storylineId <= 3 ? storylineId : storylineId % 3 + 1}`;
  
  return (
    <div className="relative pl-10 pb-8">
      <div className={`timeline-dot ${storylineClass}`} style={{ top: `${position * 40}px` }}></div>
      <Link href={`/chapters/${id}`} className="block">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
          {isRead && (
            <div className="chapter-read-indicator" title="Прочитано"></div>
          )}
          <h3 className="text-lg font-medium mb-2 hover:text-accent-1 transition-colors">{title}</h3>
        </div>
      </Link>
    </div>
  );
};

interface TimelineProps {
  chapters: {
    id: string;
    title: string;
    storylineId: number;
    isRead?: boolean;
  }[];
}

export const Timeline: React.FC<TimelineProps> = ({ chapters }) => {
  return (
    <div className="timeline">
      <div className="timeline-line"></div>
      {chapters.map((chapter, index) => (
        <TimelineItem
          key={chapter.id}
          id={chapter.id}
          title={chapter.title}
          storylineId={chapter.storylineId}
          position={index}
          isRead={chapter.isRead}
        />
      ))}
    </div>
  );
};
