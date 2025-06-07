import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const storylines = await prisma.storyLine.findMany({
        include: {
          chapters: {
            where: {
              isPublished: true
            },
            orderBy: {
              timelinePosition: 'asc'
            }
          }
        },
        orderBy: {
          displayOrder: 'asc'
        }
      });
      
      return res.status(200).json(storylines);
    } catch (error) {
      console.error('Error fetching storylines:', error);
      return res.status(500).json({ error: 'Failed to fetch storylines' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
