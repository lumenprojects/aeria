import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const chapters = await prisma.chapter.findMany({
        where: {
          isPublished: true
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
        orderBy: [
          {
            storyLine: {
              displayOrder: 'asc'
            }
          },
          {
            timelinePosition: 'asc'
          }
        ]
      });
      
      return res.status(200).json(chapters);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return res.status(500).json({ error: 'Failed to fetch chapters' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
