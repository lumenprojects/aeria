import type { CharacterFactOfDayDTO } from "@aeria/shared";
import { EntityAvatar } from "@/components/entities";
import { Separator, Skeleton, Typography } from "@/components/ui";
import { cn } from "@/lib/utils";

type CharacterFactOfDaySectionProps = {
  factOfDay: CharacterFactOfDayDTO | null;
  isLoading: boolean;
  isError: boolean;
};

export function CharacterFactOfDaySection({ factOfDay, isLoading, isError }: CharacterFactOfDaySectionProps) {
  const showSkeleton = isLoading || isError;

  if (showSkeleton) {
    return (
      <section className="characters-fact" data-testid="characters-fact" aria-busy="true">
        <div className="characters-fact-skeleton" data-testid="characters-fact-skeleton">
          <Skeleton className="characters-fact-skeleton-heading" />
          <Skeleton className="characters-fact-skeleton-subtitle" />
          <Skeleton className="characters-fact-skeleton-fact" />
          <Skeleton className="characters-fact-skeleton-subject-avatar" />
          <Skeleton className="characters-fact-skeleton-divider" />
          <div className="characters-fact-skeleton-comment">
            <Skeleton className="characters-fact-skeleton-comment-avatar" />
            <Skeleton className="characters-fact-skeleton-comment-text" />
          </div>
        </div>
      </section>
    );
  }

  if (!factOfDay) {
    return (
      <section className="characters-fact" data-testid="characters-fact">
        <div className="characters-fact-head">
          <Typography variant="h1" as="h2" className="characters-fact-heading">
            Рубрика! <em>Факт дня</em>
          </Typography>
          <Typography variant="h2" fontRole="body" as="p" className="tone-secondary characters-fact-subtitle">
            Сегодня у нас..
          </Typography>
        </div>

        <div className="characters-fact-body">
          <Typography variant="body" fontRole="body" as="p" className="characters-fact-text tone-secondary">
            Блок уже на месте. Как только появятся новые записи фактов, здесь будет ежедневная подборка по персонажам.
          </Typography>
        </div>
      </section>
    );
  }

  const { subject_character: subjectCharacter, comment_author_character: commentAuthorCharacter } = factOfDay;

  return (
    <section className="characters-fact" data-testid="characters-fact">
      <div className="characters-fact-head">
        <Typography variant="h1" as="h2" className="characters-fact-heading">
          Рубрика! <em>Факт дня</em>
        </Typography>
        <Typography variant="h2" fontRole="body" as="p" className="tone-secondary characters-fact-subtitle">
          Сегодня у нас..
        </Typography>
      </div>

      <div className="characters-fact-body">
        <Typography variant="body" fontRole="body" as="p" className="characters-fact-text">
          {factOfDay.fact_text}
        </Typography>
        <EntityAvatar
          entityType="character"
          entitySlug={subjectCharacter.slug}
          imageSrc={subjectCharacter.avatar_asset_path}
          label={subjectCharacter.name_ru}
          ariaLabel={`Открыть персонажа ${subjectCharacter.name_ru}`}
          size="md"
          className="characters-fact-subject-avatar-link"
          avatarClassName="characters-fact-subject-avatar"
        />
      </div>

      <Separator className="section-break-line width-narrow characters-fact-divider" />

      <div className={cn("characters-fact-comment", !commentAuthorCharacter && "characters-fact-comment-no-author")}>
        {commentAuthorCharacter ? (
          <EntityAvatar
            entityType="character"
            entitySlug={commentAuthorCharacter.slug}
            imageSrc={commentAuthorCharacter.avatar_asset_path}
            label={commentAuthorCharacter.name_ru}
            ariaLabel={`Открыть персонажа ${commentAuthorCharacter.name_ru}`}
            size="md"
            className="characters-fact-comment-avatar-link"
            avatarClassName="characters-fact-comment-avatar"
          />
        ) : null}
        <Typography variant="body" fontRole="body" as="p" className="tone-secondary characters-fact-comment-text">
          {factOfDay.comment_text}
        </Typography>
      </div>
    </section>
  );
}
