"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Camera, Bell, ShieldCheck, ArrowRight } from "lucide-react";
import styles from "./welcome.module.css";

export default function WelcomeClient() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/home");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    document.documentElement.classList.add("pwa-mode");
    document.body.classList.add("pwa-mode");
    return () => {
      document.documentElement.classList.remove("pwa-mode");
      document.body.classList.remove("pwa-mode");
    };
  }, []);

  return (
    <main className={styles.shell}>
      <div className={styles.deviceContainer}>
        <div className={styles.screen}>
          {/* Bento Grid Marquee Container */}
          <div className={styles.gridContainer}>
            {/* Row 0: Moving Right (Partially out of frame at the top) */}
            <div className={`${styles.marqueeRow} ${styles.topOutRow}`}>
              <div className={`${styles.marqueeTrack} ${styles.marqueeRight}`}>
                <div className={styles.trackGroup}>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/nigeria_plate_3.png" alt="Nigeria Plate 3" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardSquare}`}>
                    <img src="/illustrations/user_eyo.png" alt="Eyo Masquerade" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_traffic.jpg" alt="Lagos Traffic" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_bridge.png" alt="Lekki Bridge" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_cathedral.jpg" alt="Lagos Cathedral" />
                  </div>
                </div>
                <div className={styles.trackGroup}>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/nigeria_plate_3.png" alt="Nigeria Plate 3" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardSquare}`}>
                    <img src="/illustrations/user_eyo.png" alt="Eyo Masquerade" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_traffic.jpg" alt="Lagos Traffic" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_bridge.png" alt="Lekki Bridge" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_cathedral.jpg" alt="Lagos Cathedral" />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 1: Moving Left */}
            <div className={styles.marqueeRow}>
              <div className={`${styles.marqueeTrack} ${styles.marqueeLeft}`}>
                <div className={styles.trackGroup}>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_traffic.jpg" alt="Lagos Traffic" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/nigeria_plate.png" alt="Nigeria Plate" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_bridge.png" alt="Lekki Bridge" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardSquare}`}>
                    <img src="/illustrations/user_eyo.png" alt="Eyo Masquerade" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_cathedral.jpg" alt="Lagos Cathedral" />
                  </div>
                </div>
                <div className={styles.trackGroup}>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_traffic.jpg" alt="Lagos Traffic" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/nigeria_plate.png" alt="Nigeria Plate" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_bridge.png" alt="Lekki Bridge" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardSquare}`}>
                    <img src="/illustrations/user_eyo.png" alt="Eyo Masquerade" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_cathedral.jpg" alt="Lagos Cathedral" />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Moving Right */}
            <div className={styles.marqueeRow}>
              <div className={`${styles.marqueeTrack} ${styles.marqueeRight}`}>
                <div className={styles.trackGroup}>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_cathedral.jpg" alt="Lagos Cathedral" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_eyo.png" alt="Eyo Masquerade" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/nigeria_plate_2.png" alt="Nigeria Plate 2" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_traffic.jpg" alt="Lagos Traffic" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardSquare}`}>
                    <img src="/illustrations/user_bridge.png" alt="Lekki Bridge" />
                  </div>
                </div>
                <div className={styles.trackGroup}>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_cathedral.jpg" alt="Lagos Cathedral" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_eyo.png" alt="Eyo Masquerade" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/nigeria_plate_2.png" alt="Nigeria Plate 2" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_traffic.jpg" alt="Lagos Traffic" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardSquare}`}>
                    <img src="/illustrations/user_bridge.png" alt="Lekki Bridge" />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Moving Left */}
            <div className={styles.marqueeRow}>
              <div className={`${styles.marqueeTrack} ${styles.marqueeLeft}`}>
                <div className={styles.trackGroup}>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_bridge.png" alt="Lekki Bridge" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardSquare}`}>
                    <img src="/illustrations/user_cathedral.jpg" alt="Lagos Cathedral" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_traffic.jpg" alt="Lagos Traffic" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/nigeria_plate_3.png" alt="Nigeria Plate 3" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_eyo.png" alt="Eyo Masquerade" />
                  </div>
                </div>
                <div className={styles.trackGroup}>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_bridge.png" alt="Lekki Bridge" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardSquare}`}>
                    <img src="/illustrations/user_cathedral.jpg" alt="Lagos Cathedral" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_traffic.jpg" alt="Lagos Traffic" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/nigeria_plate_3.png" alt="Nigeria Plate 3" />
                  </div>
                  <div className={`${styles.bentoCard} ${styles.cardWide}`}>
                    <img src="/illustrations/user_eyo.png" alt="Eyo Masquerade" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Landing Copy & Actions */}
          <div className={styles.contentContainer}>
            <div className={styles.introText}>
              <h1>Check plates. Share on WhatsApp. <br /> Commute safely.</h1>
              <p>Search vehicle safety records before boarding and send a quick trip summary to your loved ones.</p>
            </div>

            {/* Feature lists explaining what app does */}
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <Camera size={18} />
                </div>
                <div className={styles.featureText}>
                  <strong>Search & Verify Plates</strong>
                  <span>Search any Lagos vehicle plate to check community flag history before stepping inside.</span>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <Bell size={18} />
                </div>
                <div className={styles.featureText}>
                  <strong>1-Tap WhatsApp Share</strong>
                  <span>Log your vehicle and route summary in seconds and send a shareable link on WhatsApp.</span>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <ShieldCheck size={18} />
                </div>
                <div className={styles.featureText}>
                  <strong>Community Flagging</strong>
                  <span>Anonymously report unsafe or reckless vehicles to keep commuters across Lagos informed.</span>
                </div>
              </div>
            </div>

            {/* Call to Actions linking to Clerk Auth */}
            <div className={styles.ctaSection}>
              <Link href="/signup" className={styles.primaryBtn}>
                Get Started <ArrowRight size={18} />
              </Link>
              <Link href="/login" className={styles.secondaryBtn}>
                Already have an account? Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
