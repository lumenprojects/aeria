import * as React from "react";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import { Flag } from "@/components/entities";
import { AspectRatio, Carousel, CarouselContent, CarouselItem, Typography } from "@/components/ui";
import { cn } from "@/lib/utils";

type CarouselApi = UseEmblaCarouselType[1];

type CountryFlagData = {
  id: string;
  slug: string;
  title_ru: string;
  flag_colors: string[];
};

type CountryMediaSlide = {
  id: string;
  mediaType: "image" | "video";
  src: string;
  poster?: string;
  title: string;
  description: string;
  country: CountryFlagData;
};

type InteractionState = {
  hover: boolean;
  focus: boolean;
  drag: boolean;
};

const mediaRatio = 2240 / 1080;
const autoplayDelayMs = 7000;

const slides: CountryMediaSlide[] = [
  {
    id: "lumendor",
    mediaType: "image",
    src: "/assets/media/countries/lumendor-vista.svg",
    title: "Lümendor",
    description:
      "Они говорят, что Люмендор построен раз и навека. Не перестраивался, а доводился до совершенства.",
    country: {
      id: "country-lumendor",
      slug: "lumendor",
      title_ru: "Люмендор",
      flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
    }
  },
  {
    id: "avzonia",
    mediaType: "video",
    src: "/assets/media/countries/placeholder-loop.mp4",
    poster: "/assets/media/countries/avzonia-meadow.svg",
    title: "Авзония",
    description:
      "Земли виноградников и тихих дворов. Здесь даже короткий разговор звучит как обещание, которое нельзя забыть.",
    country: {
      id: "country-avzonia",
      slug: "avzonia",
      title_ru: "Авзония",
      flag_colors: ["#b73a3a", "#f2eadf", "#2b567a"]
    }
  },
  {
    id: "virdan",
    mediaType: "image",
    src: "/assets/media/countries/virdan-delta.svg",
    title: "Вирдан",
    description:
      "Дельты и каналы Вирдана работают как память: ничего не теряется, всё возвращается в другой форме.",
    country: {
      id: "country-virdan",
      slug: "virdan",
      title_ru: "Вирдан",
      flag_colors: ["#4f7aa5", "#f4f6fa", "#1f2f4f"]
    }
  },
  {
    id: "selune",
    mediaType: "video",
    src: "/assets/media/countries/placeholder-loop.mp4",
    poster: "/assets/media/countries/selune-coast.svg",
    title: "Селюн",
    description:
      "Побережье Селюна не подстраивается под чужой ритм. Здесь ветер диктует расписание сильнее календаря.",
    country: {
      id: "country-selune",
      slug: "selune",
      title_ru: "Селюн",
      flag_colors: ["#e6e9f6", "#5e6f98", "#24334e"]
    }
  },
  {
    id: "norvale",
    mediaType: "image",
    src: "/assets/media/countries/norvale-citadel.svg",
    title: "Норвейл",
    description:
      "В Норвейле у камня длинная биография. Башни помнят больше правителей, чем официальные хроники.",
    country: {
      id: "country-norvale",
      slug: "norvale",
      title_ru: "Норвейл",
      flag_colors: ["#c08a63", "#f2ddd0", "#4a3126"]
    }
  },
  {
    id: "orith",
    mediaType: "image",
    src: "/assets/media/countries/orith-plateau.svg",
    title: "Орит",
    description:
      "Плато Орита кажется неподвижным, пока не заметишь маршруты караванов. Здесь движение прячется в паузах.",
    country: {
      id: "country-orith",
      slug: "orith",
      title_ru: "Орит",
      flag_colors: ["#d9b984", "#f3e3bf", "#3a2a1f"]
    }
  }
];

export function CountryMediaCarousel() {
  const [api, setApi] = React.useState<CarouselApi | undefined>();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const interactionRef = React.useRef<InteractionState>({ hover: false, focus: false, drag: false });
  const [isPaused, setIsPaused] = React.useState(false);
  const [readyVideoIds, setReadyVideoIds] = React.useState<Record<string, true>>({});

  const syncPausedState = React.useCallback(() => {
    const interaction = interactionRef.current;
    setIsPaused(interaction.hover || interaction.focus || interaction.drag);
  }, []);

  const setInteraction = React.useCallback(
    (key: keyof InteractionState, value: boolean) => {
      interactionRef.current[key] = value;
      syncPausedState();
    },
    [syncPausedState]
  );

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  React.useEffect(() => {
    if (!api) return;

    const onPointerDown = () => setInteraction("drag", true);
    const onPointerUp = () => setInteraction("drag", false);

    api.on("pointerDown", onPointerDown);
    api.on("pointerUp", onPointerUp);
    api.on("settle", onPointerUp);

    return () => {
      api.off("pointerDown", onPointerDown);
      api.off("pointerUp", onPointerUp);
      api.off("settle", onPointerUp);
    };
  }, [api, setInteraction]);

  React.useEffect(() => {
    if (!api || isPaused) return;

    const timer = window.setInterval(() => {
      const nextIndex = (api.selectedScrollSnap() + 1) % slides.length;
      api.scrollTo(nextIndex);
    }, autoplayDelayMs);

    return () => window.clearInterval(timer);
  }, [api, isPaused]);

  const handleBlurCapture = React.useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget as Node | null;
      if (nextTarget && event.currentTarget.contains(nextTarget)) return;
      setInteraction("focus", false);
    },
    [setInteraction]
  );

  const handlePointerDownCapture = React.useCallback(() => {
    setInteraction("drag", true);
  }, [setInteraction]);

  const handlePointerEndCapture = React.useCallback(() => {
    setInteraction("drag", false);
  }, [setInteraction]);

  const markVideoReady = React.useCallback((slideId: string) => {
    setReadyVideoIds((prev) => {
      if (prev[slideId]) return prev;
      return { ...prev, [slideId]: true };
    });
  }, []);

  return (
    <section
      className="home-country-carousel"
      data-testid="home-country-carousel"
      onMouseEnter={() => setInteraction("hover", true)}
      onMouseLeave={() => setInteraction("hover", false)}
      onFocusCapture={() => setInteraction("focus", true)}
      onBlurCapture={handleBlurCapture}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerUpCapture={handlePointerEndCapture}
      onPointerCancelCapture={handlePointerEndCapture}
      onMouseDownCapture={handlePointerDownCapture}
      onMouseUpCapture={handlePointerEndCapture}
    >
      <div className="home-country-carousel-frame">
        <Carousel
          aria-label="Карусель стран"
          className="home-country-carousel-shell"
          opts={{ loop: true, align: "start" }}
          setApi={setApi}
        >
          <CarouselContent className="home-country-carousel-track">
            {slides.map((slide, index) => (
              <CarouselItem
                key={slide.id}
                className="home-country-carousel-item"
                data-testid={`home-country-carousel-slide-${index + 1}`}
              >
              <AspectRatio ratio={mediaRatio}>
                  <article
                    className="home-country-carousel-media"
                    style={{
                      backgroundImage: `url(${slide.mediaType === "video" ? slide.poster ?? slide.src : slide.src})`
                    }}
                  >
                    {slide.mediaType === "video" ? (
                      <>
                        {slide.poster ? (
                          <img
                            className="home-country-carousel-video-poster"
                            src={slide.poster}
                            alt=""
                            loading="eager"
                            aria-hidden="true"
                          />
                        ) : null}
                        <video
                          className={cn(
                            "home-country-carousel-video",
                            !readyVideoIds[slide.id] && "home-country-carousel-video-pending"
                          )}
                          src={slide.src}
                          poster={slide.poster}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          onLoadedData={() => markVideoReady(slide.id)}
                          onCanPlay={() => markVideoReady(slide.id)}
                        />
                      </>
                    ) : (
                      <img className="home-country-carousel-image" src={slide.src} alt={slide.title} loading="eager" />
                    )}

                    <div className="home-country-carousel-scrim" aria-hidden="true" />

                    <div className="home-country-carousel-overlay">
                      <div className="home-country-carousel-copy">
                        <Typography variant="h1" as="h2" className="home-country-carousel-title">
                          {slide.title}
                        </Typography>
                        <Flag country={slide.country} size="sm" className="home-country-carousel-flag" />
                        <Typography variant="h3" as="p" className="home-country-carousel-description">
                          {slide.description}
                        </Typography>
                      </div>
                    </div>
                  </article>
                </AspectRatio>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div
        className="home-country-carousel-dots"
        role="tablist"
        aria-label="Переключение слайдов карусели стран"
        data-testid="home-country-carousel-dots"
      >
        {slides.map((slide, index) => (
          <button
            key={`${slide.id}-dot`}
            type="button"
            role="tab"
            aria-label={`Показать слайд: ${slide.title}`}
            aria-selected={selectedIndex === index}
            className={cn("home-country-carousel-dot", selectedIndex === index && "home-country-carousel-dot-active")}
            data-testid={`home-country-carousel-dot-${index + 1}`}
            onClick={() => api?.scrollTo(index)}
          />
        ))}
      </div>
    </section>
  );
}
