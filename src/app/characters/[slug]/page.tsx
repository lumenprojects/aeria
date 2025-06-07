'use client';

import React, { useEffect, useState } from 'react';
import { CharacterDetail } from '@/components/characters/CharacterDetail';
import Link from 'next/link';

interface Character {
  id: number;
  name: string;
  slug: string;
  avatarUrl: string;
  fullDescription: string;
  shortDescription: string;
  attributes: {
    id: number;
    attributeName: string;
    attributeValue: string;
    attributeType: string;
  }[];
  chapters: {
    chapter: {
      id: number;
      title: string;
      slug: string;
    };
  }[];
}

export default function CharacterPage({ params }: { params: { slug: string } }) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const response = await fetch(`/api/characters/${params.slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Персонаж не найден');
          }
          throw new Error('Ошибка при загрузке данных');
        }
        const data = await response.json();
        setCharacter(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [params.slug]);

  // Преобразование атрибутов в формат для компонента
  const formattedAttributes = character?.attributes.map(attr => ({
    name: attr.attributeName,
    value: attr.attributeValue
  })) || [];

  return (
    <div className="container-wide py-8">
      <div className="mb-6">
        <Link href="/characters" className="text-accent-1 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Назад к списку персонажей
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
      ) : character ? (
        <>
          <CharacterDetail
            name={character.name}
            avatarUrl={character.avatarUrl || '/images/default-avatar.png'}
            fullDescription={character.fullDescription || ''}
            attributes={formattedAttributes}
          />

          {/* Связанные главы */}
          {character.chapters.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Главы с участием персонажа</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {character.chapters.map(({ chapter }) => (
                    <li key={chapter.id} className="py-3">
                      <Link href={`/chapters/${chapter.slug}`} className="hover:text-accent-1 transition-colors">
                        {chapter.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Персонаж не найден
          </p>
        </div>
      )}
    </div>
  );
}
