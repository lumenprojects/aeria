import { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { getPagination, withArchivedFilter } from "./utils.js";

export async function registerCharactersRoutes(app: FastifyInstance) {
  app.get("/api/characters", async (req) => {
    const query = req.query as Record<string, string>;
    const { page, limit, offset } = getPagination(query);

    const where = withArchivedFilter([]);

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM characters WHERE ${where}`
    );
    const rows = await pool.query(
      `SELECT id, slug, name_ru, name_native, description FROM characters WHERE ${where} ORDER BY name_ru ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return { items: rows.rows, total: countResult.rows[0].count, page, limit };
  });

  app.get("/api/characters/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const characterResult = await pool.query(
      "SELECT id, slug, name_ru, name_native, affiliation_id, gender, race, height_cm, age, birth_country_id, favorite_food, orientation, description, quote, bio_markdown, stats, published_at FROM characters WHERE slug = $1 AND archived_at IS NULL",
      [slug]
    );
    const character = characterResult.rows[0];
    if (!character) {
      reply.code(404);
      return { error: "Character not found" };
    }

    const [traits, rumors, episodes] = await Promise.all([
      pool.query(
        "SELECT text, sort_order FROM character_traits WHERE character_id = $1 ORDER BY sort_order ASC",
        [character.id]
      ),
      pool.query(
        "SELECT text, sort_order FROM character_rumors WHERE character_id = $1 ORDER BY sort_order ASC",
        [character.id]
      ),
      pool.query(
        `SELECT e.id, e.slug, e.series_id, e.country_id, e.episode_number, e.global_order, e.title_native, e.title_ru, e.summary, e.reading_minutes, e.published_at
         FROM episodes e
         JOIN episode_characters ec ON ec.episode_id = e.id
         WHERE ec.character_id = $1 AND e.archived_at IS NULL
         ORDER BY e.global_order ASC`,
        [character.id]
      )
    ]);

    return {
      character,
      traits: traits.rows,
      rumors: rumors.rows,
      episodes: episodes.rows
    };
  });
}
