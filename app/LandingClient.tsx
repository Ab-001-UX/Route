"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { 
  ArrowUpRight, 
  Search, 
  Share2, 
  ShieldCheck, 
  Star, 
  X, 
  AlertOctagon,
  Menu,
  MessageCircle,
  ShieldAlert
} from "lucide-react";
import styles from "./landing-page.module.css";
import RouteLogo from "@/components/ui/RouteLogo";
import { QRCodeSVG } from "qrcode.react";

export default function LandingClient() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [showDesktopPanel, setShowDesktopPanel] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/home");
    }
  }, [isLoaded, isSignedIn, router]);

  const [copied, setCopied] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleCTA = useCallback(() => {
    if (typeof window !== "undefined") {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallViewport = window.innerWidth < 1024;
      if (isMobileDevice || isSmallViewport) {
        window.location.href = "/welcome";
      } else {
        setShowDesktopPanel(prev => !prev);
      }
    }
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      const linkToCopy = typeof window !== "undefined" && window.location.origin.includes("localhost")
        ? window.location.origin
        : "https://route-nine-dusky.vercel.app";
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, []);

  return (
    <div className={styles.shell}>
      {/* Hero Sky Section */}
      <section className={styles.heroSection}>
        {/* Navbar */}
        <header className={styles.navbar}>
          <Link href="/" className={styles.logoStacked} onClick={() => setMobileNavOpen(false)}>
            <RouteLogo size={68} color="#ffffff" lineColor="#0a0a0a" className={styles.navLogoDesktop} />
            <RouteLogo size={44} color="#ffffff" lineColor="#0a0a0a" className={styles.navLogoMobile} />
            <span className={styles.logoTextStacked}>Route</span>
          </Link>

          {/* Desktop nav links */}
          <nav className={styles.navLinks} style={{ marginRight: 0 }}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <Link href="#features" className={styles.navLink}>Features</Link>
            <Link href="#about" className={styles.navLink}>About Us</Link>
            <Link href="/privacy" className={styles.navLink}>Privacy</Link>
          </nav>

          {/* Mobile hamburger toggle */}
          <button
            className={styles.hamburger}
            onClick={() => setMobileNavOpen(prev => !prev)}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X size={22} color="#ffffff" /> : <Menu size={22} color="#ffffff" />}
          </button>
        </header>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className={styles.mobileDrawer}>
            <Link href="/" className={styles.mobileNavLink} onClick={() => setMobileNavOpen(false)}>Home</Link>
            <Link href="#features" className={styles.mobileNavLink} onClick={() => setMobileNavOpen(false)}>Features</Link>
            <Link href="#about" className={styles.mobileNavLink} onClick={() => setMobileNavOpen(false)}>About Us</Link>
            <Link href="/privacy" className={styles.mobileNavLink} onClick={() => setMobileNavOpen(false)}>Privacy</Link>
            <button onClick={() => { setMobileNavOpen(false); handleCTA(); }} className={styles.mobileNavCta}>
              Get Started <ArrowUpRight size={16} />
            </button>
          </div>
        )}

        {/* Hero Content */}
        <div className={styles.heroContent}>
          <h1>Check plates. Share your trip on WhatsApp. Stay safe.</h1>
          <p>
            Because every Lagos commute deserves peace of mind. Search vehicle safety records before boarding and send a quick trip summary link directly to your loved ones on WhatsApp.
          </p>
          <div className={styles.heroButtonsWrap}>
            <div className={styles.heroButtons}>
              <button onClick={handleCTA} className={styles.primaryHeroBtn}>
                Get Started
                <ArrowUpRight size={18} />
              </button>
              <a href="#features" className={styles.secondaryHeroBtn}>
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Ratings */}
        <div className={styles.trustRating}>
          <span>Trusted by commuters across all 20 Lagos Local Government Areas</span>
          <div className={styles.stars}>
            <Star size={14} fill="#fbbf24" stroke="none" />
            <Star size={14} fill="#fbbf24" stroke="none" />
            <Star size={14} fill="#fbbf24" stroke="none" />
            <Star size={14} fill="#fbbf24" stroke="none" />
            <Star size={14} fill="#fbbf24" stroke="none" />
          </div>
        </div>
      </section>

      {/* Supported Transit Categories */}
      <section id="categories" className={styles.logosSection}>
        <span className={styles.logosTitle}>Supported Commercial Transit Categories</span>
        <div className={styles.logosRow}>
          <div className={styles.logoItem}>
            <span>Danfo Buses</span>
          </div>
          <div className={styles.logoItem}>
            <span>Keke Marwa</span>
          </div>
          <div className={styles.logoItem}>
            <span>Okada Bikes</span>
          </div>
          <div className={styles.logoItem}>
            <span>Uber / Taxi</span>
          </div>
          <div className={styles.logoItem}>
            <span>Shuttle Buses</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresHeader}>
          <span className={styles.bentoLabel}>Core Features</span>
          <h2 className={styles.bentoHeadline} style={{ marginBottom: '24px' }}>Simple, powerful tools for safer commuting</h2>
        </div>

        <div className={styles.featuresGrid}>
          {/* Card 1: Instant Plate Verification */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardHeader}>
              <span className={styles.featureHashtag}>#PlateLookup</span>
              <RouteLogo size={28} color="var(--color-text-primary)" lineColor="var(--color-background-surface)" />
            </div>
            
            <div className={styles.featureCardBody}>
              <h3 className={styles.featureHeadline}>Search vehicle history before boarding.</h3>
              <p className={styles.featureDescription}>
                Instantly check if a plate has been flagged by fellow commuters for safety issues or reckless driving before you step inside.
              </p>
              
              <div className={styles.featureGraphic}>
                <div className={styles.mockLookupBar}>
                  <Search size={14} color="var(--color-text-secondary)" />
                  <span>BDG 419 AA</span>
                </div>
                
                <div className={styles.mockWarningToast}>
                  <div className={styles.toastIcon}>
                    <AlertOctagon size={20} color="#ffffff" fill="#ef4444" />
                  </div>
                  <div className={styles.toastContent}>
                    <strong className={styles.toastTitle}>Flagged – Dangerous</strong>
                    <span className={styles.toastSubtext}>Community reported safety concern</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: 1-Tap WhatsApp Share */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardHeader}>
              <span className={styles.featureHashtag}>#WhatsAppShare</span>
              <RouteLogo size={28} color="var(--color-text-primary)" lineColor="var(--color-background-surface)" />
            </div>
            
            <div className={styles.featureCardBody}>
              <h3 className={styles.featureHeadline}>1-Tap trip sharing on WhatsApp.</h3>
              <p className={styles.featureDescription}>
                Log your plate and route details in under 10 seconds. Generate a clean summary link and send it directly to your family or group chat on WhatsApp.
              </p>
              
              <div className={styles.featureGraphic}>
                <div className={styles.mockNotification}>
                  <div className={styles.notificationHeader}>
                    <MessageCircle size={14} color="#25D366" />
                    <strong>WhatsApp Message</strong>
                    <span>Now</span>
                  </div>
                  <p className={styles.notificationText}>
                    "🚍 Boarding a Yellow Danfo (LND 123 XY) from Obalende to Lekki Phase 1. View summary: https://route.app/trip/xyz"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Community Safety Network */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardHeader}>
              <span className={styles.featureHashtag}>#CommunitySafety</span>
              <RouteLogo size={28} color="var(--color-text-primary)" lineColor="var(--color-background-surface)" />
            </div>
            
            <div className={styles.featureCardBody}>
              <h3 className={styles.featureHeadline}>Report & warn fellow Lagosians anonymously.</h3>
              <p className={styles.featureDescription}>
                Spotted a dangerous or suspicious vehicle? Submit an anonymous report to warn commuters across Lagos without exposing your personal information.
              </p>
              
              <div className={styles.featureGraphic}>
                <div className={styles.mockMapContainer}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px' }}>
                    <ShieldAlert size={18} color="#ef4444" />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                      3+ Independent Reports = Flagged Badge
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={styles.bentoSection}>
        <span className={styles.bentoLabel}>About Route</span>
        <h2 className={styles.bentoHeadline}>Empowering Lagos commuters with transparent transit safety</h2>

        <div className={styles.bentoGrid}>
          <div className={`${styles.bentoCard} ${styles.bentoBlue}`}>
            <div>
              <img src="/illustrations/user_bridge.png" alt="Lekki Bridge" />
              <h3 className={styles.bentoTitle}>10,000+ Journeys Shared</h3>
              <p className={styles.bentoText}>Commuters across Lagos use Route daily to verify vehicle plates and keep loved ones informed on WhatsApp.</p>
            </div>
          </div>

          <div className={`${styles.bentoCard} ${styles.bentoGrey}`}>
            <div>
              <div className={styles.quoteIcon}>“</div>
              <p className={styles.quoteText}>
                Being able to search plate numbers before boarding Danfos and send a quick WhatsApp summary to my family gives me complete peace of mind.
              </p>
            </div>
            <div>
              <p className={styles.quoteAuthor}>Lagos Commuter</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Yaba to Lekki Commute</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerBgImage} />
        
        <div className={styles.footerContainer}>
          <div className={styles.footerTopRow}>
            <Link href="/" className={styles.logoStacked} style={{ color: '#ffffff', margin: 0, alignItems: 'flex-start' }}>
              <RouteLogo size={68} color="#ffffff" lineColor="#000000" />
            </Link>
            <div className={styles.footerSlogan}>
              CHECK PLATES. SHARE TRIPS. COMMUTE SAFELY.
            </div>
          </div>

          <div className={styles.footerColsRow}>
            <div className={styles.footerLinksCol}>
              <h4 className={styles.footerColTitle}>Menu</h4>
              <Link href="/" className={styles.footerLink}>Home</Link>
              <Link href="#features" className={styles.footerLink}>Features</Link>
              <Link href="#about" className={styles.footerLink}>About Us</Link>
            </div>

            <div className={styles.footerLinksCol}>
              <h4 className={styles.footerColTitle}>Safety Helplines</h4>
              <a href="tel:767" className={styles.footerLink}>LASEMA emergency (767)</a>
              <a href="tel:112" className={styles.footerLink}>Police helpline (112)</a>
            </div>

            <div className={styles.footerLinksCol}>
              <h4 className={styles.footerColTitle}>Legal</h4>
              <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
              
              <button onClick={handleCTA} className={styles.footerPillBtn}>
                Get Started
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.stencilContainer}>
            <span className={styles.stencilText}>ROUTE</span>
          </div>
          <span className={styles.copyright}>© 2026 Route App. Built by Abimbola. All rights reserved.</span>
        </div>
      </footer>

      {/* Desktop Modal */}
      {showDesktopPanel && (
        <div className={styles.desktopModalBackdrop} onClick={() => setShowDesktopPanel(false)}>
          <div className={styles.desktopModal} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowDesktopPanel(false)}
              className={styles.desktopModalClose}
              aria-label="Dismiss"
            >
              &#x2715;
            </button>

            <RouteLogo size={80} color="#ffffff" lineColor="#000000" />
            <h3 className={styles.desktopModalTitle}>Route is optimized for mobile</h3>
            <p className={styles.desktopModalSub}>
              To search plates at bus stops, log trip summaries, and share WhatsApp links on the go, open Route on your mobile device. Scan the QR code below.
            </p>

            <div className={styles.desktopModalQR}>
              <QRCodeSVG
                value={
                  typeof window !== "undefined"
                    ? window.location.origin.includes("localhost")
                      ? window.location.origin
                      : "https://route-nine-dusky.vercel.app"
                    : "https://route-nine-dusky.vercel.app"
                }
                size={180}
                bgColor="#ffffff"
                fgColor="#0a0a0a"
                level="M"
              />
            </div>

            <div className={styles.desktopModalUrl}>
              <span>
                {typeof window !== "undefined"
                  ? window.location.origin.includes("localhost")
                    ? window.location.origin
                    : "https://route-nine-dusky.vercel.app"
                  : "https://route-nine-dusky.vercel.app"}
              </span>
              <button onClick={handleCopyLink} className={styles.desktopModalCopyBtn}>
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
