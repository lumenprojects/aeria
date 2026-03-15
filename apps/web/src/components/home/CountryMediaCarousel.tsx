import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Flag } from "@/components/entities";
import { AspectRatio, Typography } from "@/components/ui";
import { cn } from "@/lib/utils";

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
const swipeDistanceThreshold = 90;
const swipeVelocityThreshold = 700;
const motionEase = [0.22, 1, 0.36, 1] as const;
const sceneTransition = { duration: 1.35, ease: motionEase } as const;
const copyTransition = { duration: 0.96, ease: motionEase } as const;
const dotWidthRem = 1.25;
const activeDotWidthRem = 3;
const dotLayoutTransition = { type: "spring", stiffness: 88, damping: 16, mass: 2.05 } as const;
const dotGrowthPx = ((activeDotWidthRem - dotWidthRem) / 2) * 16;

const slides: CountryMediaSlide[] = [
  {
    id: "lumendor",
    mediaType: "image",
    src: "/assets/media/countries/lumendor-vista.svg",
    title: "Lumentia",
    description:
      "Люмендор держится на порядке, фасадах и ощущении, будто город всегда был чуть больше любого человека, который в него вошёл.",
    country: {
      id: "country-lumendor",
      slug: "lumendor",
      title_ru: "Люмендор",
      flag_colors: ["#C1272D", "#111111", "#FFFFFF"]
    }
  },
  {
    id: "ausonia",
    mediaType: "video",
    src: "/assets/media/countries/placeholder-loop.mp4",
    poster: "/assets/media/countries/avzonia-meadow.svg",
    title: "Ausonia",
    description:
      "В Авзонии виноградные склоны, тёплый воздух и закрытые дворы делают даже короткий путь похожим на тихую сцену из чьей-то памяти.",
    country: {
      id: "country-ausonia",
      slug: "ausonia",
      title_ru: "Авзония",
      flag_colors: ["#CD212A", "#FFFFFF", "#0055A4"]
    }
  },
  {
    id: "marijja",
    mediaType: "image",
    src: "/assets/media/countries/virdan-delta.svg",
    title: "Marijja",
    description:
      "Мериджа живёт в солнечном ритме рынков и площадей, где шум никогда не бывает случайным, а тишина всегда временная.",
    country: {
      id: "country-marijja",
      slug: "marijja",
      title_ru: "Мериджа",
      flag_colors: ["#FFBF36", "#C1272D", "#FFBF36"]
    }
  },
  {
    id: "rosmuir",
    mediaType: "video",
    src: "/assets/media/countries/placeholder-loop.mp4",
    poster: "/assets/media/countries/selune-coast.svg",
    title: "Rosmuir",
    description:
      "Росмюр звучит прохладнее остальных: ветер, берег и камень спорят здесь друг с другом дольше, чем люди.",
    country: {
      id: "country-rosmuir",
      slug: "rosmuir",
      title_ru: "Росмюр",
      flag_colors: ["#FFFFFF", "#0055A4", "#111111"]
    }
  },
  {
    id: "vardfell",
    mediaType: "image",
    src: "/assets/media/countries/norvale-citadel.svg",
    title: "Vardfell",
    description:
      "Вардфелль не старается понравиться сразу. Сначала в нём чувствуешь силу и холодный порядок, а уже потом замечаешь его ритм.",
    country: {
      id: "country-vardfell",
      slug: "vardfell",
      title_ru: "Вардфелль",
      flag_colors: ["#507AA4", "#FFFFFF", "#203050"]
    }
  }
];

function wrapIndex(index: number) {
  return (index + slides.length) % slides.length;
}

export function CountryMediaCarousel() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const dragStateRef = React.useRef<{
    pointerId: number;
    startX: number;
    lastX: number;
    lastTimestamp: number;
    velocity: number;
    moved: boolean;
    captured: boolean;
  } | null>(null);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const interactionRef = React.useRef<InteractionState>({ hover: false, focus: false, drag: false });
  const [isPaused, setIsPaused] = React.useState(false);
  const [readyVideoIds, setReadyVideoIds] = React.useState<Record<string, true>>({});

  const activeSlide = slides[selectedIndex];

  const getDotFlowOffset = React.useCallback(
    (index: number) => {
      const distance = index - selectedIndex;
      if (distance === 0) return -dotGrowthPx;
      const absDistance = Math.abs(distance);

      if (distance < 0) {
        if (absDistance === 1) return -dotGrowthPx * 0.78;
        if (absDistance === 2) return -dotGrowthPx * 0.34;
        return 0;
      }

      if (absDistance === 1) return dotGrowthPx * 0.24;
      if (absDistance === 2) return dotGrowthPx * 0.1;
      return 0;
    },
    [selectedIndex]
  );

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

  const goTo = React.useCallback((nextIndex: number) => {
    setSelectedIndex(wrapIndex(nextIndex));
  }, []);

  const paginate = React.useCallback((step: number) => {
    setSelectedIndex((current) => wrapIndex(current + step));
  }, []);

  React.useEffect(() => {
    if (isPaused) return;

    const timer = window.setInterval(() => {
      paginate(1);
    }, autoplayDelayMs);

    return () => window.clearInterval(timer);
  }, [isPaused, paginate]);

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

  const finishGesture = React.useCallback(
    (pointerId?: number, clientX?: number) => {
      const dragState = dragStateRef.current;
      if (!dragState || (pointerId !== undefined && dragState.pointerId !== pointerId)) return;

      if (
        dragState.captured &&
        pointerId !== undefined &&
        stageRef.current?.hasPointerCapture(pointerId)
      ) {
        stageRef.current.releasePointerCapture(pointerId);
      }

      const endX = clientX ?? dragState.lastX;
      const deltaX = endX - dragState.startX;
      const velocityX = dragState.velocity;
      const moved = dragState.moved;

      dragStateRef.current = null;
      setInteraction("drag", false);

      if (!moved) return;

      if (deltaX <= -swipeDistanceThreshold || velocityX <= -swipeVelocityThreshold) {
        paginate(1);
        return;
      }

      if (deltaX >= swipeDistanceThreshold || velocityX >= swipeVelocityThreshold) {
        paginate(-1);
      }
    },
    [paginate, setInteraction]
  );

  const handleStagePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (shouldReduceMotion || event.button !== 0) return;
      dragStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        lastX: event.clientX,
        lastTimestamp: performance.now(),
        velocity: 0,
        moved: false,
        captured: false
      };
      setInteraction("drag", true);
    },
    [setInteraction, shouldReduceMotion]
  );

  const handleStagePointerMove = React.useCallback((event: React.PointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    if (!dragState.moved && Math.abs(deltaX) < 4) return;

    if (!dragState.moved) {
      if (stageRef.current) {
        stageRef.current.setPointerCapture(event.pointerId);
      }
      dragState.moved = true;
      dragState.captured = true;
    }

    const timestamp = performance.now();
    const elapsed = Math.max((timestamp - dragState.lastTimestamp) / 1000, 0.001);
    const pointerDelta = event.clientX - dragState.lastX;
    const instantaneousVelocity = pointerDelta / elapsed;

    dragState.velocity = (dragState.velocity * 0.72) + (instantaneousVelocity * 0.28);
    dragState.lastX = event.clientX;
    dragState.lastTimestamp = timestamp;

  }, []);

  const handleStagePointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      finishGesture(event.pointerId, event.clientX);
    },
    [finishGesture]
  );

  const handleStagePointerCancel = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      finishGesture(event.pointerId, event.clientX);
    },
    [finishGesture]
  );

  return (
    <motion.section
      className="home-country-carousel"
      data-testid="home-country-carousel"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.24 }}
      transition={{ duration: 1.4, ease: motionEase }}
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
        <AspectRatio ratio={mediaRatio} className="home-country-carousel-shell">
          <div
            ref={stageRef}
            className="home-country-carousel-stage"
            aria-label="Карусель стран"
            role="region"
            aria-roledescription="carousel"
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUp}
            onPointerCancel={handleStagePointerCancel}
          >
            <AnimatePresence initial={false} mode="sync">
              <motion.article
                key={activeSlide.id}
                className="home-country-carousel-media"
                data-testid={`home-country-carousel-slide-${selectedIndex + 1}`}
                initial={
                  shouldReduceMotion
                    ? false
                    : { opacity: 0, scale: 1.008, filter: "blur(4px)" }
                }
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={
                  shouldReduceMotion
                    ? undefined
                    : { opacity: 0, scale: 1.004, filter: "blur(3px)" }
                }
                transition={sceneTransition}
                style={{
                  backgroundImage: `url(${activeSlide.mediaType === "video" ? activeSlide.poster ?? activeSlide.src : activeSlide.src})`
                }}
              >
                <motion.div
                  className="home-country-carousel-media-layer"
                  initial={shouldReduceMotion ? false : { scale: 1.022 }}
                  animate={{ scale: 1 }}
                  exit={shouldReduceMotion ? undefined : { scale: 1.008 }}
                  transition={{ duration: 1.95, ease: motionEase }}
                >
                  {activeSlide.mediaType === "video" ? (
                    <>
                      {activeSlide.poster ? (
                        <img
                          className="home-country-carousel-video-poster"
                          src={activeSlide.poster}
                          alt=""
                          loading="eager"
                          aria-hidden="true"
                        />
                      ) : null}
                      <video
                        className={cn(
                          "home-country-carousel-video",
                          !readyVideoIds[activeSlide.id] && "home-country-carousel-video-pending"
                        )}
                        src={activeSlide.src}
                        poster={activeSlide.poster}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onLoadedData={() => markVideoReady(activeSlide.id)}
                        onCanPlay={() => markVideoReady(activeSlide.id)}
                      />
                    </>
                  ) : (
                    <img
                      className="home-country-carousel-image"
                      src={activeSlide.src}
                      alt={activeSlide.title}
                      loading="eager"
                    />
                  )}
                </motion.div>

                <motion.div
                  className="home-country-carousel-scrim"
                  aria-hidden="true"
                  initial={shouldReduceMotion ? false : { opacity: 0.9 }}
                  animate={{ opacity: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0.9 }}
                  transition={sceneTransition}
                />

                <div className="home-country-carousel-overlay">
                  <motion.div className="home-country-carousel-copy">
                    <motion.div
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 12, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, filter: "blur(5px)" }}
                      transition={copyTransition}
                    >
                      <Typography variant="h1" as="h2" className="home-country-carousel-title">
                        {activeSlide.title}
                      </Typography>
                    </motion.div>

                    <motion.div
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 10, filter: "blur(5px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -5, filter: "blur(4px)" }}
                      transition={{ ...copyTransition, delay: 0.12 }}
                    >
                      <Flag country={activeSlide.country} size="sm" className="home-country-carousel-flag" />
                    </motion.div>

                    <motion.div
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 12, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, filter: "blur(5px)" }}
                      transition={{ ...copyTransition, delay: 0.22 }}
                    >
                      <Typography variant="h3" as="p" className="home-country-carousel-description">
                        {activeSlide.description}
                      </Typography>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </AspectRatio>
      </div>

      <motion.div
        layout
        className="home-country-carousel-dots"
        role="tablist"
        aria-label="Переключение слайдов карусели стран"
        data-testid="home-country-carousel-dots"
      >
        {slides.map((slide, index) => (
          <motion.button
            layout
            key={`${slide.id}-dot`}
            type="button"
            role="tab"
            aria-label={`Показать слайд: ${slide.title}`}
            aria-selected={selectedIndex === index}
            className={cn("home-country-carousel-dot", selectedIndex === index && "home-country-carousel-dot-active")}
            data-testid={`home-country-carousel-dot-${index + 1}`}
            onClick={() => goTo(index)}
            animate={{
              width: selectedIndex === index ? `${activeDotWidthRem}rem` : `${dotWidthRem}rem`,
              opacity: selectedIndex === index ? 1 : 0.36,
              x: getDotFlowOffset(index),
              y: 0,
              scale: selectedIndex === index ? 1 : 0.96
            }}
            transition={dotLayoutTransition}
            whileHover={shouldReduceMotion ? undefined : { opacity: 0.7 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
          >
            {selectedIndex === index ? (
              <motion.span
                layoutId="home-country-carousel-dot-pill"
                className="home-country-carousel-dot-pill"
                transition={dotLayoutTransition}
                aria-hidden="true"
              />
            ) : null}
          </motion.button>
        ))}
      </motion.div>
    </motion.section>
  );
}







