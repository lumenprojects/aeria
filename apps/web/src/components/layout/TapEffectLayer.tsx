import React from "react";
import { TapEffect, useTheme } from "@/lib/theme";

type ActiveTapEffect = Exclude<TapEffect, "none">;

type EffectInstance = {
  id: number;
  x: number;
  y: number;
  type: ActiveTapEffect;
};

const EFFECT_DURATION: Record<ActiveTapEffect, number> = {
  ripple: 520,
  spark: 460,
  pulse: 700
};

function isPrimaryPointer(event: PointerEvent) {
  if (event.pointerType === "mouse") {
    return event.button === 0;
  }
  return true;
}

export default function TapEffectLayer() {
  const { tapEffect } = useTheme();
  const [effects, setEffects] = React.useState<EffectInstance[]>([]);
  const effectIdRef = React.useRef(0);
  const timersRef = React.useRef<number[]>([]);

  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  React.useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  React.useEffect(() => {
    if (tapEffect === "none") {
      clearTimers();
      setEffects([]);
      return;
    }

    const activeEffect = tapEffect;
    const handlePointerDown = (event: PointerEvent) => {
      if (!isPrimaryPointer(event)) return;

      const id = effectIdRef.current++;
      setEffects((current) => [
        ...current.slice(-15),
        {
          id,
          x: event.clientX,
          y: event.clientY,
          type: activeEffect
        }
      ]);

      const timer = window.setTimeout(() => {
        setEffects((current) => current.filter((effect) => effect.id !== id));
        timersRef.current = timersRef.current.filter((activeTimer) => activeTimer !== timer);
      }, EFFECT_DURATION[activeEffect]);

      timersRef.current.push(timer);
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [tapEffect, clearTimers]);

  return (
    <div className="tap-effect-layer" aria-hidden="true">
      {effects.map((effect) => (
        <span key={effect.id} className={`tap-effect tap-effect--${effect.type}`} style={{ left: effect.x, top: effect.y }}>
          <span className="tap-effect-core" />
          {effect.type === "ripple" && <span className="tap-effect-ring" />}
          {effect.type === "pulse" && (
            <>
              <span className="tap-effect-wave" />
              <span className="tap-effect-wave tap-effect-wave--second" />
            </>
          )}
          {effect.type === "spark" && (
            <span className="tap-effect-sparks">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
