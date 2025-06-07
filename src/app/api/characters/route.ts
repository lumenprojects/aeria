// API для работы с персонажами
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // ИСПРАВЛЕНО: Используем именованный импорт

// GET /api/characters - получение списка всех персонажей
export async function GET(request: NextRequest) {
  try {
    const characters = await prisma.character.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        avatarUrl: true,
        shortDescription: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(characters);
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

// POST /api/characters - создание нового персонажа
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, slug, avatarUrl, shortDescription, fullDescription, attributes } = body;
    
    // Проверка обязательных полей
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }
    
    // Проверка уникальности slug
    const existingCharacter = await prisma.character.findUnique({
      where: { slug },
    });
    
    if (existingCharacter) {
      return NextResponse.json(
        { error: 'Character with this slug already exists' },
        { status: 400 }
      );
    }
    
    // Создание персонажа с атрибутами в транзакции
    const character = await prisma.$transaction(async (tx) => {
      // Создаем персонажа
      const newCharacter = await tx.character.create({
        data: {
          name,
          slug,
          avatarUrl,
          shortDescription,
          fullDescription,
        },
      });
      
      // Если есть атрибуты, создаем их
      if (attributes && attributes.length > 0) {
        for (const attr of attributes) {
          await tx.characterAttribute.create({
            data: {
              characterId: newCharacter.id,
              attributeName: attr.name,
              attributeValue: attr.value,
              attributeType: attr.type || 'text',
              displayOrder: attr.displayOrder || 0,
            },
          });
        }
      }
      
      return newCharacter;
    });
    
    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      { error: 'Failed to create character' },
      { status: 500 }
    );
  }
}
