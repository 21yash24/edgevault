"use client";

import { motion } from "framer-motion";
import React from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ 
        duration: 0.18, 
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
