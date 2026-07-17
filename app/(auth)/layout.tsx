"use client";

import { useEffect } from "react";
import styles from "./layout.module.css";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  useEffect(() => {
    const handleAlerts = () => {
      // Query for Clerk error alerts
      const alerts = document.querySelectorAll(".cl-alert--danger, .cl-alert--error, .cl-alert");
      alerts.forEach((alert) => {
        if (alert.querySelector(".route-dismiss-btn")) return;

        // Style parent to support absolute child position
        const element = alert as HTMLElement;
        element.style.position = "relative";
        element.style.paddingRight = "36px";

        // Create the close button element
        const closeBtn = document.createElement("button");
        closeBtn.className = "route-dismiss-btn";
        closeBtn.type = "button";
        closeBtn.innerText = "×";

        // Style close button in-line to avoid external file coupling
        Object.assign(closeBtn.style, {
          position: "absolute",
          top: "6px",
          right: "8px",
          background: "none",
          border: "none",
          color: "inherit",
          fontSize: "1.25rem",
          fontWeight: "bold",
          cursor: "pointer",
          padding: "0",
          margin: "0",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: "1",
          opacity: "0.6",
          transition: "opacity 0.2s ease",
          outline: "none",
        });

        closeBtn.addEventListener("mouseenter", () => {
          closeBtn.style.opacity = "1";
        });
        closeBtn.addEventListener("mouseleave", () => {
          closeBtn.style.opacity = "0.6";
        });

        // Click event to hide the alert box
        closeBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          element.style.display = "none";
        });

        alert.appendChild(closeBtn);
      });
    };

    // Run check on mount
    handleAlerts();

    // Create observer for dynamic Clerk rendering
    const observer = new MutationObserver(handleAlerts);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("pwa-mode");
    document.body.classList.add("pwa-mode");
    return () => {
      document.documentElement.classList.remove("pwa-mode");
      document.body.classList.remove("pwa-mode");
    };
  }, []);

  return (
    <div className={styles.shell}>
      <div className={styles.viewport}>
        {children}
      </div>
    </div>
  );
}
