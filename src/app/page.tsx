'use client';

import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import QuoteDisplayBlock from '@/components/home/QuoteDisplayBlock';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero секция */}
      <HeroSection
        title="Project Aeria"
        subtitle="2024"
        description="A Writing Project Or At Least It Should Be"
        imageUrl="/images/aeria-background.jpg"
        ctaText="Learn More"
        ctaLink="#about"
      />

      <section className="mt-24 px-4">
          <QuoteDisplayBlock />
      </section>

      
      {/* О проекте */}
      <section id="about" className="container-narrow py-16">
        <h2 className="text-3xl font-bold mb-8">О проекте Aeria</h2>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            Aeria — это литературный проект, действие которого происходит в фэнтезийном мире Эрии, 
            названном в честь богини-создательницы. Мир включает в себя несколько стран, 
            каждая со своей уникальной культурой и историей.
          </p>
          <p>
            В отличие от многих фэнтезийных произведений, Aeria фокусируется не на эпических 
            приключениях по спасению мира, а на повседневной жизни и взаимоотношениях персонажей. 
            Магия существует в этом мире, но играет второстепенную роль.
          </p>
          <p>
            Повествование разделено на несколько сюжетных линий, которые иногда пересекаются, 
            а иногда развиваются параллельно. Это позволяет читателю погрузиться в разные 
            уголки мира и познакомиться с разнообразными персонажами.
          </p>
        </div>
      </section>
      
      {/* Навигационные карточки */}
      <section className="container-wide py-12 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-2xl font-bold mb-8 text-center">Исследуйте мир Aeria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Карточка персонажей */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Персонажи</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Познакомьтесь с героями и антигероями мира Эрии — от императриц до безработных магов.
              </p>
              <Link href="/characters" className="btn btn-primary">
                Смотреть персонажей
              </Link>
            </div>
          </div>
          
          {/* Карточка глав */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Главы</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Погрузитесь в истории мира Эрии через главы, организованные по сюжетным линиям.
              </p>
              <Link href="/chapters" className="btn btn-primary">
                Читать главы
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Футер */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-8 mt-auto">
        <div className="container-wide">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>© 2024 Project Aeria. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
