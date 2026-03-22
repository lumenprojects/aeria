import type {
  AtlasCatalogItemDTO,
  AtlasEntityReferenceDTO,
  AtlasEntityType,
  AtlasSection
} from "@aeria/shared";

export type AtlasCatalogViewMode = "list" | "country" | "section" | "type" | "location";

export type AtlasFeatureEntry = {
  id: string;
  title: string;
  summary: string;
  note: string;
  url: string;
  imageSrc: string | null;
  imageAlt: string;
  country: AtlasEntityReferenceDTO | null;
};

export type AtlasCatalogGroup = {
  id: string;
  title: string;
  note: string;
  count: number;
  items: AtlasCatalogItemDTO[];
};

export const atlasTypeLabels: Record<AtlasEntityType, string> = {
  country: "Страна",
  location: "Локация",
  organization: "Организация",
  object: "Объект",
  event: "Событие",
  belief: "Верование",
  concept: "Понятие",
  other: "Другое"
};

export const atlasSectionLabels: Record<AtlasSection, string> = {
  geography: "География",
  social: "Социальное",
  history: "История",
  belief: "Вера",
  object: "Объект",
  event: "Событие",
  other: "Другое"
};

export const atlasViewModeOptions = [
  { value: "list", label: "Лента" },
  { value: "country", label: "Страны" },
  { value: "section", label: "Секции" },
  { value: "type", label: "Типы" },
  { value: "location", label: "Локации" }
] as const;

const sectionNotes: Record<AtlasSection, string> = {
  geography: "Пространство, маршруты и приметы мест.",
  social: "Быт, институции и человеческие роли.",
  history: "Память, хроники и старые швы.",
  belief: "Обряды, догмы и тихие повадки.",
  object: "Вещи, символы и материальные следы.",
  event: "События, после которых мир уже другой.",
  other: "То, что не хочет укладываться в один ящик."
};

const typeNotes: Record<AtlasEntityType, string> = {
  country: "Крупные политические и культурные пространства.",
  location: "Места, города, дома и точки маршрута.",
  organization: "Сообщества, институты и коллективные структуры.",
  object: "Значимые материальные вещи мира.",
  event: "События и сдвиги, на которые можно сослаться отдельно.",
  belief: "Верования, культы и устойчивые практики.",
  concept: "Абстрактные понятия и смысловые конструкции мира.",
  other: "Сущности, которым нужен более точный тип позже."
};

function sortByTitle(a: AtlasCatalogItemDTO, b: AtlasCatalogItemDTO) {
  return a.title_ru.localeCompare(b.title_ru, "ru");
}

function sortByRecent(a: AtlasCatalogItemDTO, b: AtlasCatalogItemDTO) {
  const aTime = a.published_at ? Date.parse(a.published_at) : Number.NEGATIVE_INFINITY;
  const bTime = b.published_at ? Date.parse(b.published_at) : Number.NEGATIVE_INFINITY;
  if (aTime !== bTime) return bTime - aTime;
  return sortByTitle(a, b);
}

function sortByConnections(a: AtlasCatalogItemDTO, b: AtlasCatalogItemDTO) {
  if (a.related_count !== b.related_count) return b.related_count - a.related_count;
  return sortByTitle(a, b);
}

function pickFirstUnique(
  items: AtlasCatalogItemDTO[],
  takenIds: Set<string>,
  predicate: (item: AtlasCatalogItemDTO) => boolean,
  sorter: (a: AtlasCatalogItemDTO, b: AtlasCatalogItemDTO) => number
) {
  const candidate = [...items].filter(predicate).sort(sorter).find((item) => !takenIds.has(item.id));
  if (!candidate) return null;
  takenIds.add(candidate.id);
  return candidate;
}

function buildItemPlace(item: AtlasCatalogItemDTO) {
  if (item.location) return item.location.title_ru;
  if (item.country && item.type !== "country") return item.country.title_ru;
  return atlasTypeLabels[item.type];
}

function fallbackSummary(item: AtlasCatalogItemDTO) {
  if (item.type === "location") {
    return "У этого места пока нет короткой аннотации, но оно уже держит на себе соседние сцены.";
  }
  if (item.type === "country") {
    return "Страна пока молчит коротко, но уже задаёт тон всему соседнему.";
  }
  return "Короткое описание ещё не вынесено, зато сам узел уже можно читать как вход в мир.";
}

export function formatAtlasPublishedDate(value: string | null) {
  if (!value) return "Без даты";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Дата не указана";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(parsed);
}

export function buildAtlasFeatureEntry(items: AtlasCatalogItemDTO[]): AtlasFeatureEntry | null {
  if (items.length === 0) return null;

  const candidate =
    pickFirstUnique(items, new Set<string>(), (item) => Boolean(item.avatar_asset_path) && Boolean(item.summary), sortByRecent) ??
    pickFirstUnique(items, new Set<string>(), (item) => Boolean(item.summary) && Boolean(item.published_at), sortByRecent) ??
    pickFirstUnique(items, new Set<string>(), (item) => Boolean(item.summary), sortByConnections) ??
    items[0];

  if (!candidate) return null;

  const noteParts = [];
  noteParts.push(buildItemPlace(candidate));
  if (candidate.published_at) {
    noteParts.push(formatAtlasPublishedDate(candidate.published_at));
  } else if (candidate.related_count > 0) {
    noteParts.push(`${candidate.related_count} связ.`);
  }

  return {
    id: candidate.id,
    title: candidate.title_ru,
    summary: candidate.summary ?? fallbackSummary(candidate),
    note: noteParts.join(" / "),
    url: candidate.url,
    imageSrc: candidate.avatar_asset_path ?? null,
    imageAlt: candidate.title_ru,
    country: candidate.country ?? null
  };
}

export function buildAtlasGroups(items: AtlasCatalogItemDTO[], viewMode: AtlasCatalogViewMode): AtlasCatalogGroup[] {
  if (viewMode === "list") {
    return [
      {
        id: "list",
        title: "Каталог",
        note: "Прямая лента всех текущих результатов.",
        count: items.length,
        items
      }
    ];
  }

  const groups = new Map<string, AtlasCatalogGroup>();

  for (const item of items) {
    let key = "misc";
    let title = "Прочее";
    let note = "Остальные входы каталога.";

    if (viewMode === "country") {
      key = item.country?.slug ?? "without-country";
      title = item.country?.title_ru ?? "Без страны";
      note = item.country
        ? "Узлы, которые удобно читать через одну страну."
        : "Свободные или ещё не закреплённые географически входы.";
    }

    if (viewMode === "location") {
      key = item.location?.slug ?? (item.type === "location" ? item.slug : "without-location");
      title =
        item.location?.title_ru ??
        (item.type === "location" ? item.title_ru : "Без локации");
      note =
        item.location || item.type === "location"
          ? "Записи, которые читаются внутри одного места."
          : "Записи без локальной привязки.";
    }

    if (viewMode === "section") {
      const sectionKey = item.sections[0] ?? "other";
      key = sectionKey;
      title = atlasSectionLabels[sectionKey];
      note = sectionNotes[sectionKey];
    }

    if (viewMode === "type") {
      key = item.type;
      title = atlasTypeLabels[item.type];
      note = typeNotes[item.type];
    }

    const bucket = groups.get(key);
    if (bucket) {
      bucket.items.push(item);
      bucket.count += 1;
      continue;
    }

    groups.set(key, {
      id: key,
      title,
      note,
      count: 1,
      items: [item]
    });
  }

  return [...groups.values()].sort((a, b) => a.title.localeCompare(b.title, "ru"));
}
