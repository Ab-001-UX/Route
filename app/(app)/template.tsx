"use client";

import React from "react";
import styles from "./template.module.css";

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.pageContainer}>
      {children}
    </div>
  );
}
