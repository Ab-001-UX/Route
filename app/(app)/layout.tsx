"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, History, Bookmark, Settings } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "./layout.module.css";
import Skeleton from "@/components/ui/Skeleton";
import { identifyUser } from "@/lib/analytics";
import { useClerk } from "@clerk/nextjs";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  
  const dbUser = useQuery(api.users.getCurrentUser);
  const contacts = useQuery(api.contacts.getContacts);

  const hideBottomNav = pathname.startsWith("/trip/");

  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({
    width: "0px",
    transform: "translateX(8px)",
    opacity: 0,
  });

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = document.querySelector(`.${styles.navItem}.${styles.active}`) as HTMLElement;
      if (activeEl) {
        setIndicatorStyle({
          width: `${activeEl.offsetWidth}px`,
          transform: `translateX(${activeEl.offsetLeft}px)`,
          opacity: 1,
        });
      } else {
        setIndicatorStyle({ opacity: 0 });
      }
    };

    updateIndicator();
    const timeoutId = setTimeout(updateIndicator, 50);

    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [pathname, dbUser]);

  useEffect(() => {
    if (dbUser) {
      identifyUser(dbUser._id);
    }
  }, [dbUser]);

  // Session inactivity/app closure timeout check (20 minutes)
  useEffect(() => {
    const checkSessionTimeout = async () => {
      const lastActive = localStorage.getItem("route-last-active");
      if (lastActive) {
        const inactiveTime = Date.now() - parseInt(lastActive, 10);
        const twentyMinutes = 20 * 60 * 1000;
        if (inactiveTime > twentyMinutes) {
          localStorage.removeItem("route-last-active");
          try {
            await signOut();
            router.replace("/login");
          } catch (err) {
            console.error("Inactivity logout failed:", err);
          }
          return;
        }
      }
      localStorage.setItem("route-last-active", Date.now().toString());
    };

    checkSessionTimeout();

    // Event listeners to capture when the user leaves/minimizes the app
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        localStorage.setItem("route-last-active", Date.now().toString());
      } else {
        checkSessionTimeout();
      }
    };

    const handlePageHide = () => {
      localStorage.setItem("route-last-active", Date.now().toString());
    };

    // Update active timestamp on user interaction
    const updateActivity = () => {
      localStorage.setItem("route-last-active", Date.now().toString());
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("click", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("scroll", updateActivity);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("scroll", updateActivity);
    };
  }, [signOut, router]);

  useEffect(() => {
    document.documentElement.classList.add("pwa-mode");
    document.body.classList.add("pwa-mode");
    return () => {
      document.documentElement.classList.remove("pwa-mode");
      document.body.classList.remove("pwa-mode");
    };
  }, []);

  useEffect(() => {
    // If queries are loaded and user hasn't completed onboarding, redirect them
    if (dbUser === null || (dbUser !== undefined && !dbUser.displayName)) {
      router.replace("/onboarding");
    }
  }, [dbUser, router]);

  // Show a loading screen while checking onboarding state
  if (dbUser === undefined || contacts === undefined) {
    return (
      <div className={styles.shell}>
        <div className={styles.viewport}>
          <div 
            className={styles.content} 
            style={{
              paddingTop: "24px",
              paddingLeft: "24px",
              paddingRight: "24px",
              paddingBottom: hideBottomNav ? 0 : "24px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <div>
                <Skeleton variant="text" width={100} height={16} style={{ marginBottom: "8px" }} />
                <Skeleton variant="text" width={140} height={24} />
              </div>
              <Skeleton variant="circular" width={40} height={40} />
            </div>
            <Skeleton variant="rectangular" width="100%" height={160} style={{ marginBottom: "24px", borderRadius: "16px" }} />
            <Skeleton variant="text" width={180} height={20} style={{ marginBottom: "16px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Skeleton variant="rectangular" width="100%" height={90} style={{ borderRadius: "16px" }} />
              <Skeleton variant="rectangular" width="100%" height={90} style={{ borderRadius: "16px" }} />
            </div>
          </div>
          {!hideBottomNav && (
            <nav className={styles.bottomNav}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.navItem} style={{ opacity: 0.5, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Skeleton variant="circular" width={20} height={20} style={{ marginBottom: "4px" }} />
                  <Skeleton variant="text" width={30} height={10} />
                </div>
              ))}
            </nav>
          )}
        </div>
      </div>
    );
  }

  // If redirected, prevent rendering children
  if (dbUser === null || !dbUser.displayName) {
    return null;
  }

  const navItems = [
    { label: "Home", href: "/home", icon: Home },
    { label: "Trips", href: "/trip", icon: History },
    { label: "Bookmark", href: "/saved", icon: Bookmark },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const activeIndex = navItems.findIndex((item) => pathname.startsWith(item.href));

  return (
    <div className={styles.shell}>
      <div className={styles.viewport}>
        <div 
          className={styles.content}
          style={
            hideBottomNav 
              ? { paddingBottom: 0 } 
              : pathname === "/settings" 
                ? { paddingBottom: "96px" } 
                : undefined
          }
        >
          {children}
        </div>
        {!hideBottomNav && (
          <nav className={styles.bottomNav}>
            <div 
              className={styles.navIndicator} 
              style={indicatorStyle}
            />
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={20} className={styles.icon} />
                  <span className={styles.label}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
