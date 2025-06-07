import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  
  if (typeof slug !== 'string') {
    return res.status(400).json({ error: 'Invalid chapter slug' });
  }

  if (req.method === 'GET') {
    try {
      const chapter = await prisma.chapter.findUnique({
        where: {
          slug: slug,
        },
        include: {
          storyLine: true,
          characters: {
            include: {
              character: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  avatarUrl: true
                }
              }
            }
          }
        },
      });
      
      if (!chapter) {
        return res.status(404).json({ error: 'Chapter not found' });
      }
      
      // Находим предыдущую и следующую главы
      const prevChapter = await prisma.chapter.findFirst({
        where: {
          storyLineId: chapter.storyLineId,
          timelinePosition: {
            lt: chapter.timelinePosition || 0
          },
          isPublished: true
        },
        orderBy: {
          timelinePosition: 'desc'
        },
        select: {
          slug: true
        }
      });
      
      const nextChapter = await prisma.chapter.findFirst({
        where: {
          storyLineId: chapter.storyLineId,
          timelinePosition: {
            gt: chapter.timelinePosition || 0
          },
          isPublished: true
        },
        orderBy: {
          timelinePosition: 'asc'
        },
        select: {
          slug: true
        }
      });
      
      // Добавляем информацию о предыдущей и следующей главах
      const chapterWithNavigation = {
        ...chapter,
        prevChapterId: prevChapter?.slug || null,
        nextChapterId: nextChapter?.slug || null
      };
      
      return res.status(200).json(chapterWithNavigation);
    } catch (error) {
      console.error(`Error fetching chapter ${slug}:`, error);
      return res.status(500).json({ error: 'Failed to fetch chapter' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
