import { useQuery } from "@tanstack/react-query";
import { AboutMeSection } from "@/components/home/AboutMeSection";
import { AvatarConveyorSection } from "@/components/home/AvatarConveyorSection";
import { CountryMediaCarousel } from "@/components/home/CountryMediaCarousel";
import { CountrySnapshotSection } from "@/components/home/CountrySnapshotSection";
import { HeardQuoteSection } from "@/components/home/HeardQuoteSection";
import { LatestEpisodeHero } from "@/components/home/LatestEpisodeHero";
import { SectionBreak, Skeleton, Typography } from "@/components/ui";
import { getHomeSnapshot } from "@/lib/api";

type HomeSection = {
  key: string;
  content: JSX.Element;
  boundaryBefore?: "line" | "stars";
};

function renderSectionFlow(sections: HomeSection[]) {
  return sections.map((section, index) => (
    <div key={section.key}>
      {index > 0 && (
        <SectionBreak
          variant={section.boundaryBefore ?? "line"}
          lineWidthClassName="width-medium"
        />
      )}
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
      key: "loading-conveyor",
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
      key: "loading-conveyor-list",
      boundaryBefore: "line",
      content: (
        <div className="width-medium">
          <div className="home-conveyor">
            <Skeleton className="h-28 w-[min(100%,44rem)] self-center" />
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

  sections.push({
    key: "country-snapshot",
    boundaryBefore: "line",
    content: (
      <div className="width-medium">
        <CountrySnapshotSection />
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
    key: "conveyor",
    boundaryBefore: "line",
    content: (
      <div className="width-medium">
        <AvatarConveyorSection />
      </div>
    )
  });

  return <div className="home-feed">{renderSectionFlow(sections)}</div>;
}
