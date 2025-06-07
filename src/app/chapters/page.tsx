'use client';

import React, { useEffect, useState } from 'react';
import { Timeline } from '@/components/chapters/Timeline';
import { ChapterCard } from '@/components/chapters/ChapterCard';

interface StoryLine {
  id: number;
  title: string;
  slug: string;
  description: string;
  color: string;
}

interface Chapter {
  id: number;
  title: string;
  slug: string;
  storylineId: number;
  summary: string;
  isRead?: boolean;
}

export default function ChaptersPage() {
  const [storylines, setStorylines] = useState<StoryLine[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStoryline, setActiveStoryline] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('grid');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка сюжетных линий
        const storylinesResponse = await fetch('/api/storylines');
        if (!storylinesResponse.ok) {
          throw new Error('Failed to fetch storylines');
        }
        const storylinesData = await storylinesResponse.json();
        setStorylines(storylinesData);
        
        // Если есть сюжетные линии, устанавливаем первую как активную
        if (storylinesData.length > 0) {
          setActiveStoryline(storylinesData[0].id);
        }
        
        // Загрузка глав
        const chaptersResponse = await fetch('/api/chapters');
        if (!chaptersResponse.ok) {
          throw new Error('Failed to fetch chapters');
        }
        const chaptersData = await chaptersResponse.json();
        
        // Проверяем прочитанные главы из cookies
        const readChapters = getReadChaptersFromCookies();
        const chaptersWithReadStatus = chaptersData.map((chapter: Chapter) => ({
          ...chapter,
          isRead: readChapters.includes(chapter.slug)
        }));
        
        setChapters(chaptersWithReadStatus);
      } catch (err) {
        setError('Не удалось загрузить данные');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Получение прочитанных глав из cookies
  const getReadChaptersFromCookies = (): string[] => {
    if (typeof document === 'undefined') return [];
    
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('readChapters='));
      
    if (!cookie) return [];
    
    try {
      return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
    } catch {
      return [];
    }
  };

  // Фильтрация глав по активной сюжетной линии
  const filteredChapters = activeStoryline 
    ? chapters.filter(chapter => chapter.storylineId === activeStoryline)
    : chapters;

  return (
    <div className="container-wide py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Главы</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Переключатель режима просмотра */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                viewMode === 'grid'
                  ? 'bg-accent-1 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              Сетка
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                viewMode === 'timeline'
                  ? 'bg-accent-1 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'
              }`}
            >
              Таймлайн
            </button>
          </div>
          
          {/* Фильтр по сюжетным линиям */}
          <select
            className="form-input"
            value={activeStoryline || ''}
            onChange={(e) => setActiveStoryline(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Все сюжетные линии</option>
            {storylines.map((storyline) => (
              <option key={storyline.id} value={storyline.id}>
                {storyline.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-1"></div>
        </div>
      ) : error ? (
        <div className="bg-error bg-opacity-10 text-error p-4 rounded-md">
          {error}
        </div>
      ) : (
        <>
          {filteredChapters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {activeStoryline ? 'В этой сюжетной линии пока нет глав' : 'Список глав пуст'}
              </p>
            </div>
          ) : viewMode === 'timeline' ? (
            <Timeline chapters={filteredChapters} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChapters.map((chapter) => (
                <ChapterCard
                  key={chapter.id}
                  id={chapter.slug}
                  title={chapter.title}
                  storylineId={chapter.storylineId}
                  summary={chapter.summary || ''}
                  isRead={chapter.isRead}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
