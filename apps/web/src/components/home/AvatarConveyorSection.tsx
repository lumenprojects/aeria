import * as React from "react";
import { motion } from "framer-motion";
import { useQueries } from "@tanstack/react-query";
import { EntityAvatar } from "@/components/entities";
import { Typography } from "@/components/ui/typography";
import { getAtlasEntry, getCharacter } from "@/lib/api";
import { cn } from "@/lib/utils";

type ConveyorEntityType = "character" | "location" | "atlas_entry";

type ConveyorSeedItem = {
  entityType: ConveyorEntityType;
  slug: string;
};

type ConveyorItem = {
  entityType: ConveyorEntityType;
  slug: string;
  label: string;
  imageSrc: string;
};

const conveyorSeed: ConveyorSeedItem[] = [
  { entityType: "location", slug: "capital-example" },
  { entityType: "character", slug: "character-001" },
  { entityType: "atlas_entry", slug: "atlas-001" },
  { entityType: "character", slug: "ame" },
  { entityType: "character", slug: "character-003" },
  { entityType: "character", slug: "character-002" }
];

const conveyorSpeedPxPerSecond = 42;
const motionEase = [0.22, 1, 0.36, 1] as const;
const sectionTransition = { duration: 0.66, ease: motionEase };
const avatarRevealVariants = {
  hidden: (index: number) => ({
    opacity: 0,
    y: 22 + (index % 3) * 4,
    scale: 0.92,
    filter: "blur(8px)"
  }),
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.52,
      delay: 0.1 + index * 0.06,
      ease: motionEase
    }
  })
};

function normalizeOffset(value: number, width: number) {
  if (width <= 0) return 0;
  const normalized = value % width;
  return normalized < 0 ? normalized + width : normalized;
}

async function resolveConveyorItem(seed: ConveyorSeedItem): Promise<ConveyorItem | null> {
  if (seed.entityType === "character") {
    const data = await getCharacter(seed.slug);
    const avatar = data?.character?.avatar_asset_path;
    const label = data?.character?.name_ru;
    if (!avatar || !label) return null;
    return {
      entityType: "character",
      slug: seed.slug,
      label,
      imageSrc: avatar
    };
  }

  const data = await getAtlasEntry(seed.slug);
  const avatar = data?.entry?.avatar_asset_path;
  const label = data?.entry?.title_ru;
  if (!avatar || !label) return null;

  return {
    entityType: seed.entityType,
    slug: seed.slug,
    label,
    imageSrc: avatar
  };
}

export function AvatarConveyorSection() {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const firstGroupRef = React.useRef<HTMLDivElement | null>(null);
  const dragStateRef = React.useRef<
    {
      pointerId: number;
      startX: number;
      startOffset: number;
      lastX: number;
      lastTimestamp: number;
      velocity: number;
      moved: boolean;
      captured: boolean;
    } | null
  >(
    null
  );
  const inertiaFrameRef = React.useRef<number | null>(null);
  const suppressClickRef = React.useRef(false);
  const cycleWidthRef = React.useRef(0);
  const offsetRef = React.useRef(0);
  const [offset, setOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isInertia, setIsInertia] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  const queryResults = useQueries({
    queries: conveyorSeed.map((seed) => ({
      queryKey: ["home-conveyor", seed.entityType, seed.slug],
      queryFn: () => resolveConveyorItem(seed),
      retry: false
    }))
  });

  const items = React.useMemo(
    () =>
      queryResults
        .map((result) => result.data)
        .filter((value): value is ConveyorItem => Boolean(value)),
    [queryResults]
  );
  const itemSignature = React.useMemo(
    () => items.map((item) => `${item.entityType}:${item.slug}:${item.imageSrc}`).join("|"),
    [items]
  );

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  React.useEffect(() => {
    const track = trackRef.current;
    const firstGroup = firstGroupRef.current;
    if (!track || !firstGroup || items.length === 0) return;

    const recalculateCycleWidth = () => {
      const groupWidth = firstGroup.getBoundingClientRect().width;
      const trackGap = Number.parseFloat(window.getComputedStyle(track).columnGap || "0");
      cycleWidthRef.current = groupWidth + trackGap;
      offsetRef.current = normalizeOffset(offsetRef.current, cycleWidthRef.current);
      setOffset(offsetRef.current);
    };

    recalculateCycleWidth();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(recalculateCycleWidth);
      observer.observe(track);
      observer.observe(firstGroup);
    }

    window.addEventListener("resize", recalculateCycleWidth);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", recalculateCycleWidth);
    };
  }, [itemSignature, items.length]);

  React.useEffect(() => {
    if (reduceMotion || isDragging || isInertia || items.length < 2) return;

    let frameId = 0;
    let lastTimestamp = performance.now();

    const tick = (timestamp: number) => {
      const cycleWidth = cycleWidthRef.current;
      const elapsed = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (cycleWidth > 0) {
        const nextOffset = normalizeOffset(offsetRef.current + elapsed * conveyorSpeedPxPerSecond, cycleWidth);
        offsetRef.current = nextOffset;
        setOffset(nextOffset);
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isDragging, isInertia, items.length, reduceMotion]);

  const stopInertia = React.useCallback(() => {
    if (inertiaFrameRef.current !== null) {
      window.cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
    setIsInertia(false);
  }, []);

  const startInertia = React.useCallback(
    (initialVelocity: number) => {
      stopInertia();
      if (reduceMotion || Math.abs(initialVelocity) < 24) return;

      setIsInertia(true);
      let velocity = initialVelocity;
      let lastTimestamp = performance.now();

      const tick = (timestamp: number) => {
        const cycleWidth = cycleWidthRef.current;
        const elapsed = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;

        if (cycleWidth > 0) {
          const nextOffset = normalizeOffset(offsetRef.current + velocity * elapsed, cycleWidth);
          offsetRef.current = nextOffset;
          setOffset(nextOffset);
        }

        velocity *= Math.exp(-7.5 * elapsed);

        if (Math.abs(velocity) < 8) {
          stopInertia();
          return;
        }

        inertiaFrameRef.current = window.requestAnimationFrame(tick);
      };

      inertiaFrameRef.current = window.requestAnimationFrame(tick);
    },
    [reduceMotion, stopInertia]
  );

  React.useEffect(() => stopInertia, [stopInertia]);

  const finishDrag = React.useCallback((pointerId?: number) => {
    const dragState = dragStateRef.current;
    if (pointerId !== undefined && dragState?.pointerId !== pointerId) return;

    if (dragState?.captured && pointerId !== undefined && viewportRef.current?.hasPointerCapture(pointerId)) {
      viewportRef.current.releasePointerCapture(pointerId);
    }

    const moved = dragState?.moved ?? false;
    const velocity = dragState?.velocity ?? 0;
    dragStateRef.current = null;
    setIsDragging(false);
    if (!moved) return;

    startInertia(velocity);

    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }, [startInertia]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (items.length === 0 || event.button !== 0) return;
    stopInertia();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: offsetRef.current,
      lastX: event.clientX,
      lastTimestamp: performance.now(),
      velocity: 0,
      moved: false,
      captured: false
    };
    suppressClickRef.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    const cycleWidth = cycleWidthRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId || cycleWidth <= 0) return;

    const deltaX = event.clientX - dragState.startX;
    if (!dragState.moved && Math.abs(deltaX) < 4) return;
    if (!dragState.moved) {
      if (viewportRef.current) {
        viewportRef.current.setPointerCapture(event.pointerId);
      }
      dragState.moved = true;
      dragState.captured = true;
      setIsDragging(true);
    }

    const nextOffset = normalizeOffset(dragState.startOffset - deltaX, cycleWidth);
    offsetRef.current = nextOffset;
    setOffset(nextOffset);

    const timestamp = performance.now();
    const elapsed = Math.max((timestamp - dragState.lastTimestamp) / 1000, 0.001);
    const pointerDelta = event.clientX - dragState.lastX;
    const instantaneousVelocity = -pointerDelta / elapsed;

    dragState.velocity = (dragState.velocity * 0.72) + (instantaneousVelocity * 0.28);
    dragState.lastX = event.clientX;
    dragState.lastTimestamp = timestamp;
  };

  const renderConveyorGroup = (
    groupItems: ConveyorItem[],
    groupKey: string,
    hidden = false,
    animateItems = false
  ) => (
    <div
      ref={hidden ? undefined : firstGroupRef}
      className="home-conveyor-group"
      aria-hidden={hidden ? "true" : undefined}
    >
      {groupItems.map((item, index) => (
        <motion.div
          key={`${groupKey}:${item.entityType}:${item.slug}`}
          className="home-conveyor-avatar-shell"
          custom={index}
          initial={animateItems && !reduceMotion ? "hidden" : false}
          whileInView={animateItems && !reduceMotion ? "visible" : undefined}
          viewport={{ once: true, amount: 0.45 }}
          variants={animateItems && !reduceMotion ? avatarRevealVariants : undefined}
        >
          <EntityAvatar
            entityType={item.entityType}
            entitySlug={item.slug}
            imageSrc={item.imageSrc}
            label={item.label}
            size="lg"
            className="home-conveyor-avatar-link"
            avatarClassName="home-conveyor-avatar"
          />
        </motion.div>
      ))}
    </div>
  );

  return (
    <motion.section
      className="home-conveyor"
      data-testid="home-avatar-conveyor"
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={sectionTransition}
    >
      <Typography variant="h2" as="h2" className="home-conveyor-title">
        Ваше личное <em>пространство</em>
        <br />
        для погружения
      </Typography>

      <div
        ref={viewportRef}
        className={cn("home-conveyor-lane", isDragging && "home-conveyor-lane-dragging")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishDrag(event.pointerId)}
        onPointerCancel={(event) => finishDrag(event.pointerId)}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div
          ref={trackRef}
          className="home-conveyor-track"
          style={{ transform: `translate3d(${-offset}px, 0, 0)` }}
        >
          {renderConveyorGroup(items, "main", false, true)}
          {renderConveyorGroup(items, "clone", true, false)}
        </div>
      </div>
    </motion.section>
  );
}
