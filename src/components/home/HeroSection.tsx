'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  description,
  imageUrl,
  ctaText,
  ctaLink
}) => {
  return (
    <section className="relative w-full h-[calc(100vh-94px)] overflow-hidden">
      {/* Фоновое изображение */}
      <div className="absolute inset-0 bg-cover bg-center z-0">
        <Image 
          src={imageUrl} 
          alt={title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-dark bg-opacity-30 dark:bg-opacity-50"></div>
      </div>

      {/* Контент */}
      <div className="relative z-10 w-full h-full flex items-center">
        <div className="container-narrow">
          <div className="flex flex-col justify-between h-full py-8">
            {/* Верх */}
            <div className="flex justify-between items-start">
              <h1 className="text-lg sm:text-xl md:text-2xl font-light text-white fade-in">
                {title}
              </h1>
              <div className="text-sm px-2 py-1 border rounded-md text-white border-white fade-in" style={{animationDelay: '0.2s'}}>
                {subtitle}
              </div>
            </div>

            {/* Центр */}
            <div className="mt-auto max-w-lg">
              <p className="text-2xl sm:text-3xl md:text-5xl font-medium leading-snug text-white fade-in" style={{animationDelay: '0.4s'}}>
                {description}
              </p>
            </div>

            {/* Кнопка */}
            <div className="mt-8">
              <Link
                href={ctaLink}
                className="inline-block text-lg sm:text-xl md:text-2xl font-medium text-white underline fade-in"
                style={{animationDelay: '0.6s'}}
              >
                {ctaText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
