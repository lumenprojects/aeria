'use client';

import React from 'react';
import Image from 'next/image';

interface CharacterDetailProps {
  name: string;
  avatarUrl: string;
  fullDescription: string;
  attributes: {
    name: string;
    value: string;
  }[];
}

export const CharacterDetail: React.FC<CharacterDetailProps> = ({
  name,
  avatarUrl,
  fullDescription,
  attributes
}) => {
  return (
    <div className="container-narrow py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Аватар персонажа */}
          <div className="md:w-1/3 p-6 flex justify-center">
            <div className="character-avatar w-48 h-48 md:w-64 md:h-64">
              <Image 
                src={avatarUrl} 
                alt={name}
                width={256}
                height={256}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Информация о персонаже */}
          <div className="md:w-2/3 p-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{name}</h1>
            
            {/* Атрибуты персонажа */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              {attributes.map((attr, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{attr.name}</span>
                  <div className="font-medium">{attr.value}</div>
                </div>
              ))}
            </div>
            
            {/* Полное описание */}
            <h2 className="text-xl font-semibold mb-2">О персонаже</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{fullDescription}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
