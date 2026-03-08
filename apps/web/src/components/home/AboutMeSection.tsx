import type { HomeAboutProfileDTO } from "@aeria/shared";
import { EntityAvatar } from "@/components/entities";
import { MarkdownContent, Typography } from "@/components/ui";

type AboutMeSectionProps = {
  profile: HomeAboutProfileDTO;
};

export function AboutMeSection({ profile }: AboutMeSectionProps) {
  return (
    <section className="home-about">
      <EntityAvatar
        entityType="character"
        entitySlug={profile.slug}
        imageSrc={profile.avatar_asset_path}
        label={profile.name_ru}
        ariaLabel={`Открыть скрытую страницу ${profile.name_ru}`}
        size="md"
        className="home-about-avatar-link"
        avatarClassName="home-about-avatar"
      />

      <div className="home-about-copy">
        <Typography variant="h2" as="h2" className="home-about-title">
          {profile.home_intro_title}
        </Typography>
        <div className="home-about-body role-body type-h3">
          <MarkdownContent source={profile.home_intro_markdown} />
        </div>
      </div>
    </section>
  );
}
