"use client";

import { motion, useReducedMotion } from "motion/react";

/** A vermilion seal that presses in when it scrolls into view. */
export function Stamp({ kanji, delay = 0, rotate = -3, size = 50 }: { kanji: string; delay?: number; rotate?: number; size?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      lang="ja"
      className="t-seal t-kanji"
      style={{ rotate, width: size, height: size, fontSize: size * 0.58 }}
      initial={reduce ? false : { opacity: 0, scale: 1.45 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {kanji}
    </motion.span>
  );
}
