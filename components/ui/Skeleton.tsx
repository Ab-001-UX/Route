"use client";

import React from "react";
import styles from "./skeleton.module.css";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export default function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  style,
}: SkeletonProps) {
  const mergedStyle: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={mergedStyle}
    />
  );
}
