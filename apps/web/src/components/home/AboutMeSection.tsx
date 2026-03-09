import { motion, useReducedMotion } from "framer-motion";
import type { HomeAboutProfileDTO } from "@aeria/shared";
import { EntityAvatar } from "@/components/entities";
import { MarkdownContent, RevealText, Typography } from "@/components/ui";

type AboutMeSectionProps = {
  profile: HomeAboutProfileDTO;
};

const motionEase = [0.22, 1, 0.36, 1] as const;

export function AboutMeSection({ profile }: AboutMeSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="home-about">
      <motion.div
        className="home-about-avatar-shell"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 22, scale: 0.94, filter: "blur(10px)" }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1.28, ease: motionEase }}
      >
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
      </motion.div>

      <div className="home-about-copy">
        <Typography variant="h2" as="h2" className="home-about-title">
          <RevealText text={profile.home_intro_title} mode="words" delay={0.24} />
        </Typography>
        <div className="home-about-body role-body type-h3">
          <MarkdownContent
            source={profile.home_intro_markdown}
            revealMode="words"
            revealDelay={0.52}
            revealBlockDelay={0.44}
          />
        </div>
      </div>
    </section>
  );
}

