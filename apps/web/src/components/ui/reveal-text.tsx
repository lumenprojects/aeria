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

type RevealRichTextProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
};

type RevealRenderState = {
  tokenIndex: number;
};

type RevealTimingSettings = {
  delay: number;
  stagger: number;
  duration: number;
};

const revealEase = [0.22, 1, 0.36, 1] as const;
const revealDuration = 0.84;
const charStagger = 0.032;
const wordStagger = 0.09;

function splitText(text: string, mode: RevealTextMode) {
  if (mode === "chars") return text.split("");
  return text.split(/(\s+)/);
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((child) => extractText(child)).join("");
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) return "";
  return extractText(node.props.children);
}

function renderRevealNode(
  node: React.ReactNode,
  state: RevealRenderState,
  settings: RevealTimingSettings,
  keyPrefix: string
): React.ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
      .split(/(\s+)/)
      .filter((part) => part.length > 0)
      .map((part, index) => {
        if (/^\s+$/.test(part)) {
          return (
            <span aria-hidden="true" key={`${keyPrefix}-space-${index}`} style={{ whiteSpace: "pre-wrap" }}>
              {part}
            </span>
          );
        }

        const tokenDelay = settings.delay + state.tokenIndex * settings.stagger;
        state.tokenIndex += 1;

        return (
          <motion.span
            aria-hidden="true"
            key={`${keyPrefix}-token-${index}`}
            initial={{ opacity: 0, y: "0.32em", filter: "blur(6px)" }}
            animate={{ opacity: 1, y: "0em", filter: "blur(0px)" }}
            transition={{ duration: settings.duration, delay: tokenDelay, ease: revealEase }}
            style={{ display: "inline-block", whiteSpace: "pre" }}
          >
            {part}
          </motion.span>
        );
      });
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <React.Fragment key={`${keyPrefix}-fragment-${index}`}>
        {renderRevealNode(child, state, settings, `${keyPrefix}-${index}`)}
      </React.Fragment>
    ));
  }

  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return node;
  }

  return React.cloneElement(
    node,
    undefined,
    renderRevealNode(node.props.children, state, settings, `${keyPrefix}-child`)
  );
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
  const tokenStagger = stagger ?? (mode === "chars" ? charStagger : wordStagger);

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
            transition={{ duration: revealDuration, ease: revealEase }}
            style={{ display: "inline-block", whiteSpace: isWhitespace ? "pre" : "normal" }}
          >
            {token}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

export function RevealRichText({
  children,
  className,
  delay = 0,
  stagger = wordStagger
}: RevealRichTextProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <span className={className}>{children}</span>;
  }

  const state: RevealRenderState = { tokenIndex: 0 };
  const settings: RevealTimingSettings = {
    delay,
    stagger,
    duration: revealDuration
  };
  const text = extractText(children);

  return (
    <span aria-label={text} className={className}>
      <span style={visuallyHiddenStyle}>{text}</span>
      <span aria-hidden="true">{renderRevealNode(children, state, settings, "rich-reveal")}</span>
    </span>
  );
}
