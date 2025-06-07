'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CharacterCardProps {
  id: string;
  name: string;
  avatarUrl: string;
  shortDescription: string;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  id,
  name,
  avatarUrl,
  shortDescription
}) => {
  return (
    <Link href={`/characters/${id}`} className="block">
      <div className="character-card group">
        <div className="character-avatar w-32 h-32 mb-4">
          <Image 
            src={avatarUrl} 
            alt={name}
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-lg font-medium mb-2 group-hover:text-accent-1 transition-colors">{name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{shortDescription}</p>
      </div>
    </Link>
  );
};
