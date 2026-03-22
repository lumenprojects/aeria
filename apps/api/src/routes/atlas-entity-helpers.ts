import {
  AtlasEntityDTO,
  AtlasEntityReferenceDTO,
  type AtlasEntityDTO as AtlasEntityData,
  type AtlasEntityReferenceDTO as AtlasEntityReferenceData
} from "@aeria/shared";
import { entityUrl, toNullableIsoDateTime, validateResponse } from "./utils.js";

export type AtlasEntityReferenceRow = {
  id: string;
  slug: string;
  type: AtlasEntityReferenceData["type"];
  title_ru: string;
  summary: string | null;
  avatar_asset_path: string | null;
  flag_colors: string[] | null;
};

export type AtlasEntityRow = AtlasEntityReferenceRow & {
  overview_markdown?: string | null;
  published_at?: string | Date | null;
  country_entity_id?: string | null;
  location_entity_id?: string | null;
};

export function toAtlasEntityReference(row: AtlasEntityReferenceRow, routeId: string) {
  return validateResponse(
    AtlasEntityReferenceDTO,
    {
      id: row.id,
      slug: row.slug,
      url: entityUrl("atlas_entity", row.slug),
      type: row.type,
      title_ru: row.title_ru,
      summary: row.summary ?? null,
      avatar_asset_path: row.avatar_asset_path ?? null,
      flag_colors: row.flag_colors ?? null
    },
    routeId
  );
}

export function toAtlasEntity(
  row: AtlasEntityRow,
  country: AtlasEntityReferenceData | null,
  location: AtlasEntityReferenceData | null,
  routeId: string
) {
  return validateResponse(
    AtlasEntityDTO,
    {
      id: row.id,
      slug: row.slug,
      url: entityUrl("atlas_entity", row.slug),
      type: row.type,
      title_ru: row.title_ru,
      summary: row.summary ?? null,
      avatar_asset_path: row.avatar_asset_path ?? null,
      flag_colors: row.flag_colors ?? null,
      overview_markdown: row.overview_markdown ?? null,
      published_at: toNullableIsoDateTime(row.published_at),
      country,
      location
    },
    routeId
  );
}
