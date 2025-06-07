// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Создаём сюжетную линию
  const storyLine = await prisma.storyLine.create({
    data: {
      title: 'Основная линия',
      slug: 'main-story',
      description: 'Главная сюжетная линия',
      color: '#FF5733',
    },
  });

  // Создаём главу
  const chapter = await prisma.chapter.create({
    data: {
      title: 'Глава 1: Начало',
      slug: 'chapter-1',
      storyLineId: storyLine.id,
      content: 'Это начало истории...',
      summary: 'Краткое описание главы.',
      chapterNumber: 1,
      timelinePosition: 0,
      isPublished: true,
    },
  });

  // Создаём персонажа
  const character = await prisma.character.create({
    data: {
      name: 'Аэриа',
      slug: 'aeria',
      shortDescription: 'Главная героиня',
      fullDescription: 'Подробное описание персонажа Аэриа.',
      avatarUrl: 'https://example.com/avatar.jpg',
      attributes: {
        create: [
          {
            attributeName: 'Возраст',
            attributeValue: '18',
          },
          {
            attributeName: 'Роль',
            attributeValue: 'Протагонист',
          },
        ],
      },
      chapters: {
        create: [
          {
            chapterId: chapter.id,
            isMainCharacter: true,
          },
        ],
      },
    },
  });

  console.log('Seed завершён. Добавлены:');
  console.log('Сюжет:', storyLine);
  console.log('Глава:', chapter);
  console.log('Персонаж:', character);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
