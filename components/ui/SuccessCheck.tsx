"use client";

import { motion } from "framer-motion";

export default function SuccessCheck() {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 52"
      className="w-10 10 text-[#9DC56E]"
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="26"
        cy="26"
        r="25"
        fill="none"
        stroke="#9DC56E"
        strokeWidth="2"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
              duration: 0.6,
              ease: "easeInOut",
            },
          },
        }}
      />
      <motion.path
        fill="none"
        stroke="#9DC56E"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 27 l7 7 l17 -17"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
              delay: 0.4,
              duration: 0.6,
              ease: "easeInOut",
            },
          },
        }}
      />
    </motion.svg>
  );
}
