"use client";

import { motion, useReducedMotion } from "motion/react";

/** A hanging scroll that unrolls when it comes into view. */
export function Makimono({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="t-makimono"
      initial={reduce ? false : "rolled"}
      whileInView="open"
      viewport={{ once: true, margin: "-120px" }}
    >
      <div className="t-roller" aria-hidden="true" />
      <motion.div
        className="overflow-hidden"
        variants={{
          rolled: { height: 0 },
          open: { height: "auto", transition: { duration: 1.5, ease: [0.76, 0, 0.24, 1] } },
        }}
      >
        <div className="t-scroll-paper t-washi">
          <div className="t-fibers" aria-hidden="true" />
          <div className="relative">{children}</div>
        </div>
      </motion.div>
      <div className="t-roller" aria-hidden="true" />
    </motion.div>
  );
}
