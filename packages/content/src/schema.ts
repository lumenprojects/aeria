import { z } from "zod";
import { atlasKindValues, characterRumorSourceTypeValues, entityTypeValues } from "@aeria/shared";

export const slugSchema = z.string().min(1);
export const assetWebPathSchema = z.string().regex(/^\/assets\/.+/, "Asset path must start with /assets/");

export const seriesSchema = z.object({
  slug: slugSchema,
  title_ru: z.string().min(1),
  brand_color: z.string().optional().nullable(),
  summary: z.string().optional().nullable()
});

export const countrySchema = z.object({
  slug: slugSchema,
  title_ru: z.string().min(1),
  flag_colors: z.array(z.string()).optional().nullable()
});

export const locationSchema = z.object({
  slug: slugSchema,
  title_ru: z.string().min(1),
  country_slug: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  avatar_asset_path: assetWebPathSchema.optional().nullable()
});

export const episodeSchema = z.object({
  slug: slugSchema,
  series_slug: slugSchema,
  country_slug: slugSchema,
  episode_number: z.number().int(),
  global_order: z.number().int(),
  title_native: z.string().optional().nullable(),
  title_ru: z.string().min(1),
  summary: z.string().optional().nullable(),
  reading_minutes: z.number().int().optional().nullable(),
  published_at: z.string().optional().nullable(),
  characters: z.array(slugSchema).default([]),
  locations: z.array(slugSchema).default([])
});

export const characterRumorSchema = z
  .object({
    text: z.string().min(1),
    author_name: z.string().min(1),
    author_meta: z.string().optional().nullable(),
    source_type: z.enum(characterRumorSourceTypeValues).optional().nullable(),
    source_slug: slugSchema.optional().nullable()
  })
  .superRefine((value, ctx) => {
    if ((value.source_type && !value.source_slug) || (!value.source_type && value.source_slug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rumor source_type and source_slug must either both be provided or both be omitted"
      });
    }
  });

export const characterSchema = z.object({
  slug: slugSchema,
  name_ru: z.string().min(1),
  avatar_asset_path: assetWebPathSchema,
  name_native: z.string().optional().nullable(),
  affiliation_slug: z.string().optional().nullable(),
  country_slug: slugSchema,
  tagline: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  race: z.string().optional().nullable(),
  height_cm: z.number().int().optional().nullable(),
  age: z.number().int().optional().nullable(),
  orientation: z.string().optional().nullable(),
  mbti: z.string().optional().nullable(),
  favorite_food: z.string().optional().nullable(),
  quirks: z.array(z.string()).default([]),
  rumors: z.array(characterRumorSchema).default([]),
  published_at: z.string().optional().nullable()
});

export const atlasLinkSchema = z.object({
  type: z.enum(entityTypeValues),
  slug: slugSchema,
  label: z.string().optional().nullable()
});

export const atlasSchema = z.object({
  slug: slugSchema,
  kind: z.enum(atlasKindValues),
  title_ru: z.string().min(1),
  summary: z.string().optional().nullable(),
  avatar_asset_path: assetWebPathSchema.optional().nullable(),
  country_slug: z.string().optional().nullable(),
  location_slug: z.string().optional().nullable(),
  links: z.array(atlasLinkSchema).default([]),
  published_at: z.string().optional().nullable()
});

export type SeriesFrontmatter = z.infer<typeof seriesSchema>;
export type CountryFrontmatter = z.infer<typeof countrySchema>;
export type LocationFrontmatter = z.infer<typeof locationSchema>;
export type EpisodeFrontmatter = z.infer<typeof episodeSchema>;
export type CharacterFrontmatter = z.infer<typeof characterSchema>;
export type CharacterRumorFrontmatter = z.infer<typeof characterRumorSchema>;
export type AtlasFrontmatter = z.infer<typeof atlasSchema>;
export type AtlasLinkFrontmatter = z.infer<typeof atlasLinkSchema>;
