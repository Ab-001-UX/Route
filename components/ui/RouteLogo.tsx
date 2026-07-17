"use client";

import React from "react";

interface RouteLogoProps {
  size?: number;
  color?: string;
  lineColor?: string;
  className?: string;
}

export default function RouteLogo({
  size = 48,
  color = "#ffffff",
  lineColor = "transparent",
  className = ""
}: RouteLogoProps) {
  // If lineColor is transparent, we will resolve it to a background contrast color
  const finalLineColor = lineColor === "transparent" ? "rgba(0, 0, 0, 0.25)" : lineColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ overflow: "visible" }}
    >
      {/* 
        Neo-Geo stylized "R" loop representing a winding highway.
        It consists of three segments drawn as a single smooth stroke.
      */}
      <path
        d="M 28 82 C 24 55 24 35 34 22 C 46 8 72 8 82 22 C 92 36 86 52 70 58 C 55 64 36 60 36 60 C 36 60 52 74 68 82"
        stroke={color}
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 
        Central dotted lane line indicating the road motif.
      */}
      <path
        d="M 28 82 C 24 55 24 35 34 22 C 46 8 72 8 82 22 C 92 36 86 52 70 58 C 55 64 36 60 36 60 C 36 60 52 74 68 82"
        stroke={finalLineColor}
        strokeWidth="2.5"
        strokeDasharray="6 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
