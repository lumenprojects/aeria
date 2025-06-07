// API для работы с конкретным персонажем
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // ИСПРАВЛЕНО: Используем именованный импорт

// GET /api/characters/[slug] - получение информации о персонаже по slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    const character = await prisma.character.findUnique({
      where: { slug },
      include: {
        attributes: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        chapters: {
          include: {
            chapter: true,
          },
        },
      },
    });
    
    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(character);
  } catch (error) {
    console.error(`Error fetching character with slug ${params.slug}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch character' },
      { status: 500 }
    );
  }
}

// PUT /api/characters/[slug] - обновление персонажа
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const body = await request.json();
    
    const { name, avatarUrl, shortDescription, fullDescription, attributes } = body;
    
    // Проверка существования персонажа
    const existingCharacter = await prisma.character.findUnique({
      where: { slug },
    });
    
    if (!existingCharacter) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }
    
    // Обновление персонажа с атрибутами в транзакции
    const updatedCharacter = await prisma.$transaction(async (tx) => {
      // Обновляем персонажа
      const character = await tx.character.update({
        where: { slug },
        data: {
          name,
          avatarUrl,
          shortDescription,
          fullDescription,
        },
      });
      
      // Если есть атрибуты, обновляем их
      if (attributes && attributes.length > 0) {
        // Удаляем существующие атрибуты
        await tx.characterAttribute.deleteMany({
          where: { characterId: character.id },
        });
        
        // Создаем новые атрибуты
        for (const attr of attributes) {
          await tx.characterAttribute.create({
            data: {
              characterId: character.id,
              attributeName: attr.name,
              attributeValue: attr.value,
              attributeType: attr.type || 'text',
              displayOrder: attr.displayOrder || 0,
            },
          });
        }
      }
      
      return character;
    });
    
    return NextResponse.json(updatedCharacter);
  } catch (error) {
    console.error(`Error updating character with slug ${params.slug}:`, error);
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

// DELETE /api/characters/[slug] - удаление персонажа
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    // Проверка существования персонажа
    const existingCharacter = await prisma.character.findUnique({
      where: { slug },
    });
    
    if (!existingCharacter) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }
    
    // Удаление персонажа
    await prisma.character.delete({
      where: { slug },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting character with slug ${params.slug}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}
