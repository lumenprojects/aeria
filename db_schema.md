# Структура базы данных для сайта Aeria

## Обзор

База данных PostgreSQL для сайта Aeria должна обеспечивать гибкость для различных типов персонажей и сложную структуру сюжетных линий. Ниже представлена схема базы данных, которая удовлетворяет этим требованиям.

## Таблицы

### 1. Characters (Персонажи)

```sql
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    avatar_url VARCHAR(255),
    short_description TEXT,
    full_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. CharacterAttributes (Атрибуты персонажей)

```sql
CREATE TABLE character_attributes (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT,
    attribute_type VARCHAR(50) DEFAULT 'text', -- text, number, date, etc.
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, attribute_name)
);
```

### 3. StoryLines (Сюжетные линии)

```sql
CREATE TABLE storylines (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20), -- для визуального различия на UI
    display_order INTEGER DEFAULT 0,
    parent_storyline_id INTEGER REFERENCES storylines(id), -- для ветвлений
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Chapters (Главы)

```sql
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    storyline_id INTEGER REFERENCES storylines(id),
    content TEXT,
    summary TEXT,
    chapter_number INTEGER,
    timeline_position INTEGER, -- позиция в общей хронологии
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5. ChapterCharacters (Связь глав и персонажей)

```sql
CREATE TABLE chapter_characters (
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    is_main_character BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (chapter_id, character_id)
);
```

### 6. ChapterRelationships (Связи между главами)

```sql
CREATE TABLE chapter_relationships (
    id SERIAL PRIMARY KEY,
    source_chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    target_chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- 'sequel', 'prequel', 'parallel', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_chapter_id, target_chapter_id)
);
```

### 7. Settings (Настройки сайта)

```sql
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 8. AdminUsers (Пользователи админ-панели)

```sql
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Индексы

```sql
CREATE INDEX idx_characters_slug ON characters(slug);
CREATE INDEX idx_chapters_slug ON chapters(slug);
CREATE INDEX idx_chapters_storyline_id ON chapters(storyline_id);
CREATE INDEX idx_character_attributes_character_id ON character_attributes(character_id);
CREATE INDEX idx_chapter_characters_character_id ON chapter_characters(character_id);
CREATE INDEX idx_chapter_relationships_source ON chapter_relationships(source_chapter_id);
CREATE INDEX idx_chapter_relationships_target ON chapter_relationships(target_chapter_id);
```

## Примеры гибких атрибутов персонажей

Таблица `character_attributes` позволяет хранить различные атрибуты для разных типов персонажей:

### Для императрицы:
- Имя: "Рост", Значение: "165 см", Тип: "text"
- Имя: "Пол", Значение: "Женский", Тип: "text"
- Имя: "Титул", Значение: "Императрица Северных земель", Тип: "text"
- Имя: "Годы правления", Значение: "1203-1245", Тип: "text"

### Для мага:
- Имя: "Рост", Значение: "178 см", Тип: "text"
- Имя: "Пол", Значение: "Мужской", Тип: "text"
- Имя: "Специализация", Значение: "Огненная магия", Тип: "text"
- Имя: "Уровень силы", Значение: "4", Тип: "number"

### Для дворфа:
- Имя: "Рост", Значение: "120 см", Тип: "text"
- Имя: "Пол", Значение: "Мужской", Тип: "text"
- Имя: "Клан", Значение: "Каменные молоты", Тип: "text"
- Имя: "Ремесло", Значение: "Кузнец", Тип: "text"

## Примеры данных для сюжетных линий

### Основная сюжетная линия:
- ID: 1
- Название: "Путешествие Арно"
- Описание: "История Арно, который отправляется работать в поместье Бастида де ла Люн д'Ор"
- Родительская линия: NULL

### Ответвление:
- ID: 2
- Название: "Жизнь в поместье"
- Описание: "События, происходящие в поместье Бастида де ла Люн д'Ор"
- Родительская линия: 1

### Параллельная линия:
- ID: 3
- Название: "Интриги Авзонии"
- Описание: "Политические события в Авзонии"
- Родительская линия: NULL
