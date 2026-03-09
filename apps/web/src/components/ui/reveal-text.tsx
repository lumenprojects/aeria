import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

type RevealTextMode = "words" | "chars";

type RevealTextProps = {
  text: string;
  mode?: RevealTextMode;
  className?: string;
  delay?: number;
  stagger?: number;
};

function splitText(text: string, mode: RevealTextMode) {
  if (mode === "chars") return text.split("");
  return text.split(/(\s+)/);
}

const visuallyHiddenStyle: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0
};

export function RevealText({
  text,
  mode = "words",
  className,
  delay = 0,
  stagger
}: RevealTextProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const tokens = splitText(text, mode);
  const tokenStagger = stagger ?? (mode === "chars" ? 0.016 : 0.045);

  return (
    <motion.span
      aria-label={text}
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: tokenStagger
          }
        }
      }}
    >
      <span style={visuallyHiddenStyle}>{text}</span>
      {tokens.map((token, index) => {
        const isWhitespace = /^\s+$/.test(token);
        return (
          <motion.span
            aria-hidden="true"
            key={`${mode}-${index}-${token}`}
            variants={{
              hidden: { opacity: 0, y: "0.32em", filter: "blur(6px)" },
              visible: { opacity: 1, y: "0em", filter: "blur(0px)" }
            }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: "inline-block", whiteSpace: isWhitespace ? "pre" : "normal" }}
          >
            {token}
          </motion.span>
        );
      })}
    </motion.span>
  );
}
