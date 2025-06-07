'use client';

import React, { useEffect, useState } from 'react';
import { ChapterReader } from '@/components/chapters/ChapterReader';
import Link from 'next/link';

interface Chapter {
  id: number;
  title: string;
  slug: string;
  content: string;
  chapterNumber: number;
  storyLineId: number;
  storyLine: {
    title: string;
  };
  characters: {
    character: {
      id: number;
      name: string;
      slug: string;
    };
    isMainCharacter: boolean;
  }[];
}

interface ChapterRelation {
  previousChapter: { slug: string } | null;
  nextChapter: { slug: string } | null;
}

export default function ChapterPage({ params }: { params: { slug: string } }) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapterRelations, setChapterRelations] = useState<ChapterRelation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        // Загрузка данных главы
        const response = await fetch(`/api/chapters/${params.slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Глава не найдена');
          }
          throw new Error('Ошибка при загрузке данных');
        }
        const data = await response.json();
        setChapter(data);
        
        // Загрузка связей с другими главами
        const relationsResponse = await fetch(`/api/chapters/${params.slug}/relations`);
        if (relationsResponse.ok) {
          const relationsData = await relationsResponse.json();
          setChapterRelations(relationsData);
        }
        
        // Отмечаем главу как прочитанную
        markChapterAsRead(params.slug);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [params.slug]);

  // Функция для отметки главы как прочитанной
  const markChapterAsRead = (slug: string) => {
    if (typeof document === 'undefined') return;
    
    // Получаем текущие прочитанные главы из cookies
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('readChapters='));
      
    let readChapters: string[] = [];
    
    if (cookie) {
      try {
        readChapters = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
      } catch {
        readChapters = [];
      }
    }
    
    // Добавляем текущую главу, если её ещё нет
    if (!readChapters.includes(slug)) {
      readChapters.push(slug);
      
      // Сохраняем обновленный список в cookies
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6); // Срок хранения 6 месяцев
      
      document.cookie = `readChapters=${encodeURIComponent(JSON.stringify(readChapters))}; expires=${expiryDate.toUTCString()}; path=/`;
    }
  };

  return (
    <div className="container-wide py-8">
      <div className="mb-6">
        <Link href="/chapters" className="text-accent-1 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Назад к списку глав
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-1"></div>
        </div>
      ) : error ? (
        <div className="bg-error bg-opacity-10 text-error p-4 rounded-md">
          {error}
        </div>
      ) : chapter ? (
        <>
          {/* Информация о сюжетной линии */}
          <div className="mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Сюжетная линия: {chapter.storyLine.title}
            </span>
          </div>
          
          <ChapterReader
            title={chapter.title}
            content={chapter.content || 'Содержимое главы отсутствует.'}
            chapterNumber={chapter.chapterNumber || 0}
            previousChapterId={chapterRelations?.previousChapter?.slug}
            nextChapterId={chapterRelations?.nextChapter?.slug}
          />
          
          {/* Персонажи в главе */}
          {chapter.characters && chapter.characters.length > 0 && (
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Персонажи в этой главе</h2>
              <div className="flex flex-wrap gap-2">
                {chapter.characters.map(({ character, isMainCharacter }) => (
                  <Link 
                    key={character.id} 
                    href={`/characters/${character.slug}`}
                    className={`px-3 py-1 rounded-full text-sm ${
                      isMainCharacter 
                        ? 'bg-accent-1 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {character.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Глава не найдена
          </p>
        </div>
      )}
    </div>
  );
}
