'use client';

import React, { useEffect, useState } from 'react';
import { CharacterCard } from '@/components/characters/CharacterCard';

interface Character {
  id: number;
  name: string;
  slug: string;
  avatarUrl: string;
  shortDescription: string;
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('/api/characters');
        if (!response.ok) {
          throw new Error('Failed to fetch characters');
        }
        const data = await response.json();
        setCharacters(data);
      } catch (err) {
        setError('Не удалось загрузить список персонажей');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  // Фильтрация персонажей по поисковому запросу
  const filteredCharacters = characters.filter(character => 
    character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (character.shortDescription && character.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container-wide py-8">
      <h1 className="text-3xl font-bold mb-8">Персонажи</h1>
      
      {/* Поиск */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Поиск персонажей..."
          className="form-input w-full md:w-1/2 lg:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
          {filteredCharacters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Персонажи не найдены' : 'Список персонажей пуст'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  id={character.slug}
                  name={character.name}
                  avatarUrl={character.avatarUrl || '/images/default-avatar.png'}
                  shortDescription={character.shortDescription || ''}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
