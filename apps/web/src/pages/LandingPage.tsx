import { useQuery } from "@tanstack/react-query";
import { AboutMeSection } from "@/components/home/AboutMeSection";
import { AvatarConveyorSection } from "@/components/home/AvatarConveyorSection";
import { CountryMediaCarousel } from "@/components/home/CountryMediaCarousel";
import { CountrySnapshotSection } from "@/components/home/CountrySnapshotSection";
import { HeardQuoteSection } from "@/components/home/HeardQuoteSection";
import { LatestEpisodeHero } from "@/components/home/LatestEpisodeHero";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  SectionBreak,
  Skeleton,
  RevealText,
  Typography
} from "@/components/ui";
import { getHomeSnapshot } from "@/lib/api";

type HomeSection = {
  key: string;
  content: JSX.Element;
  boundaryBefore?: "line" | "stars";
};

function HomeKnowledgeAccordion() {
  return (
    <section className="home-faq">
      <Accordion type="single" collapsible className="width-medium">
        <AccordionItem value="item-1">
          <AccordionTrigger className="home-faq-trigger role-heading type-h2">О чём этот сайт ?</AccordionTrigger>
          <AccordionContent className="home-faq-content">
            <Typography as="p" variant="body" fontRole="body" className="home-faq-content-text">
              Это интерактивное издание о мире Aeria: эпизоды, персонажи, места и их связи.
            </Typography>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger className="home-faq-trigger role-heading type-h2">
            Как часто выходят новые эпизоды?
          </AccordionTrigger>
          <AccordionContent className="home-faq-content">
            <Typography as="p" variant="body" fontRole="body" className="home-faq-content-text">
              Публикации выходят регулярно. Точный ритм зависит от редакционного цикла и этапа сезона.
            </Typography>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger className="home-faq-trigger role-heading type-h2">С чего лучше начинать чтение?</AccordionTrigger>
          <AccordionContent className="home-faq-content">
            <Typography as="p" variant="body" fontRole="body" className="home-faq-content-text">
              Лучше начать с последнего эпизода на главной, затем открыть связанные аватарки и перейти в атлас.
            </Typography>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger className="home-faq-trigger role-heading type-h2">Можно ли предложить идею?</AccordionTrigger>
          <AccordionContent className="home-faq-content">
            <Typography as="p" variant="body" fontRole="body" className="home-faq-content-text">
              Да. Идеи по темам, героям и структуре выпусков можно передавать через редакционный канал Aeria.
            </Typography>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}

function renderSectionFlow(sections: HomeSection[]) {
  return sections.map((section, index) => (
    <div key={section.key}>
      {index > 0 && <SectionBreak variant={section.boundaryBefore ?? "line"} lineWidthClassName="width-narrow" />}
      {section.content}
    </div>
  ));
}

function loadingSections(): HomeSection[] {
  return [
    {
      key: "loading-latest",
      content: (
        <div className="width-wide">
          <Skeleton className="h-[28rem] w-full rounded-lg" />
        </div>
      )
    },
    {
      key: "loading-about",
      boundaryBefore: "line",
      content: (
        <div className="width-medium">
          <div className="home-about">
            <Skeleton className="h-[var(--avatar-md)] w-[var(--avatar-md)] rounded-full" />
            <div className="showcase-stack-sm">
              <Skeleton className="h-14 w-64" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      )
    },
    {
      key: "loading-carousel",
      boundaryBefore: "line",
      content: (
        <div className="width-wide">
          <div className="home-country-carousel-loading">
            <Skeleton className="home-country-carousel-loading-media" />
            <div className="home-country-carousel-loading-dots">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={`home-country-carousel-loading-dot-${index}`}
                  className={index === 2 ? "home-country-carousel-loading-dot-pill" : "home-country-carousel-loading-dot"}
                />
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "loading-heard-quote",
      boundaryBefore: "stars",
      content: (
        <div className="width-medium">
          <div className="home-heard">
            <div className="home-heard-copy">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-10 w-[min(100%,30rem)] self-center rounded-lg" />
            </div>
            <Skeleton className="h-10 w-[min(100%,18rem)] rounded-lg" />
          </div>
        </div>
      )
    },
    {
      key: "loading-country-snapshot",
      boundaryBefore: "line",
      content: (
        <div className="width-medium">
          <div className="home-country-snapshot">
            <Skeleton className="home-country-carousel-loading-media" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      )
    },
    {
      key: "loading-conveyor-intro",
      boundaryBefore: "line",
      content: (
        <div className="width-medium">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      )
    },
    {
      key: "loading-conveyor-list",
      boundaryBefore: "stars",
      content: (
        <div className="width-medium">
          <div className="home-conveyor">
            <div className="home-conveyor-loading-row">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={`home-conveyor-loading-${index}`}
                  className="h-[var(--avatar-lg)] w-[var(--avatar-lg)] rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "loading-accordion",
      boundaryBefore: "line",
      content: (
        <div className="width-medium">
          <div className="showcase-stack-sm">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      )
    },
    {
      key: "loading-edition-note",
      boundaryBefore: "line",
      content: (
        <div className="width-medium">
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      )
    }
  ];
}

export default function LandingPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["home"],
    queryFn: getHomeSnapshot,
    retry: false
  });

  if (isLoading) {
    return <div className="home-feed">{renderSectionFlow(loadingSections())}</div>;
  }

  if (isError) {
    return (
      <div className="home-feed">
        <Typography variant="h4" as="h1">
          Главная временно недоступна
        </Typography>
        <Typography variant="muted">
          {error instanceof Error ? error.message : "Не удалось загрузить данные главной страницы."}
        </Typography>
      </div>
    );
  }

  const sections: HomeSection[] = [];

  if (data?.latest_episode) {
    sections.push({
      key: "latest",
      content: (
        <div className="width-wide">
          <LatestEpisodeHero episode={data.latest_episode} />
        </div>
      )
    });
  }

  if (data?.about_profile) {
    sections.push({
      key: "about",
      boundaryBefore: "line",
      content: (
        <div className="width-medium">
          <AboutMeSection profile={data.about_profile} />
        </div>
      )
    });
  }

  sections.push({
    key: "country-carousel",
    boundaryBefore: "line",
    content: (
      <div className="width-wide">
        <CountryMediaCarousel />
      </div>
    )
  });

  if (data?.world_quote) {
    sections.push({
      key: "heard-quote",
      boundaryBefore: "stars",
      content: (
        <div className="width-medium">
          <HeardQuoteSection initialQuote={data.world_quote} />
        </div>
      )
    });
  }

  sections.push({
    key: "country-snapshot",
    boundaryBefore: "line",
    content: (
      <div className="width-medium">
        <CountrySnapshotSection />
      </div>
    )
  });

  sections.push({
    key: "conveyor-intro",
    boundaryBefore: "line",
    content: (
      <div className="width-medium">
        <Typography variant="h1" as="h2" className="home-conveyor-intro">
          Вы знали что каждая аватарка тут <em>кликабельна</em>?
          <br />
          <br />
          Обязательно опробуйте
        </Typography>
      </div>
    )
  });

  sections.push({
    key: "conveyor",
    boundaryBefore: "stars",
    content: (
      <div className="width-medium">
        <AvatarConveyorSection />
      </div>
    )
  });

  sections.push({
    key: "home-accordion",
    boundaryBefore: "line",
    content: (
      <div className="width-medium">
        <HomeKnowledgeAccordion />
      </div>
    )
  });

  sections.push({
    key: "edition-note",
    boundaryBefore: "line",
    content: (
      <div className="width-medium">
        <Typography variant="ui" fontRole="heading" as="p" className="home-edition-note"><RevealText text="Aeria · издание 2026" mode="words" /><br /><em><RevealText text="Roam with You" mode="words" delay={0.24} /></em></Typography>
      </div>
    )
  });

  return <div className="home-feed">{renderSectionFlow(sections)}</div>;
}

