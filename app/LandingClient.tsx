"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowUpRight, 
  Search, 
  ShieldAlert, 
  Navigation, 
  Star, 
  Shield, 
  X,
  Smartphone,
  Chrome,
  BellRing,
  Clock,
  Database,
  AlertTriangle,
  AlertOctagon,
  Menu
} from "lucide-react";
import styles from "./landing-page.module.css";
import RouteLogo from "@/components/ui/RouteLogo";
import { QRCodeSVG } from "qrcode.react";

export default function LandingClient() {
  const router = useRouter();
  const [showDesktopPanel, setShowDesktopPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleCTA = useCallback(() => {
    if (typeof window !== "undefined") {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallViewport = window.innerWidth < 1024;
      if (isMobileDevice || isSmallViewport) {
        router.push("/welcome");
      } else {
        setShowDesktopPanel(prev => !prev);
      }
    }
  }, [router]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
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
          <h1>Securing Lagos commutes through community-driven safety</h1>
          <p>
            Because every Lagos commute deserves to feel safe. Route puts the power back in your hands — before you board, while you travel, and until you arrive.
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

      {/* Transit logos/partners section */}
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
            <span>Uber & Bolt</span>
          </div>
          <div className={styles.logoItem}>
            <span>Shuttle Buses</span>
          </div>
        </div>
      </section>

      {/* Redesigned Features Section with structured cards */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresHeader}>
          <span className={styles.bentoLabel}>Core Features</span>
          <h2 className={styles.bentoHeadline} style={{ marginBottom: '24px' }}>Features built to keep you secure on the road</h2>
        </div>

        <div className={styles.featuresGrid}>
          {/* Card 1: Instant Plate Verification */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardHeader}>
              <span className={styles.featureHashtag}>#PlateLookup</span>
              <RouteLogo size={28} color="var(--color-text-primary)" lineColor="var(--color-background-surface)" />
            </div>
            
            <div className={styles.featureCardBody}>
              <h3 className={styles.featureHeadline}>Search commercial vehicle history before boarding.</h3>
              <p className={styles.featureDescription}>
                Instantly check if a vehicle has been flagged by previous commuters for route deviations, reckless driving, or security concerns.
              </p>
              {/* Graphic: Lookup Plate simulator matching the app */}
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
                    <span className={styles.toastSubtext}>Reckless driving & route concerns reported</span>
                  </div>
                  <X size={12} className={styles.toastClose} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Contact Alerting System */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardHeader}>
              <span className={styles.featureHashtag}>#TripSharing</span>
              <RouteLogo size={28} color="var(--color-text-primary)" lineColor="var(--color-background-surface)" />
            </div>
            
            <div className={styles.featureCardBody}>
              <h3 className={styles.featureHeadline}>Share your ride details automatically in real-time.</h3>
              <p className={styles.featureDescription}>
                Log your transit type and route. Route automatically shares your vehicle details and live GPS coordinates with your emergency contacts.
              </p>
              
              {/* Graphic: Alert Notification mockup */}
              <div className={styles.featureGraphic}>
                <div className={styles.mockNotification}>
                  <div className={styles.notificationHeader}>
                    <BellRing size={12} color="#0f75fc" />
                    <strong>Route Alert</strong>
                    <span>Now</span>
                  </div>
                  <p className={styles.notificationText}>
                    <strong>Amara</strong> has boarded a Yellow Danfo (BDG 419 AA) at Lekki Toll Gate. Live GPS tracking is active.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Autonomous Check-In */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardHeader}>
              <span className={styles.featureHashtag}>#SafetyCheckin</span>
              <RouteLogo size={28} color="var(--color-text-primary)" lineColor="var(--color-background-surface)" />
            </div>
            
            <div className={styles.featureCardBody}>
              <h3 className={styles.featureHeadline}>Automate your safety check-ins with trip timers.</h3>
              <p className={styles.featureDescription}>
                Set a travel timer for your route. If the timer expires before you check in, Route prompts your emergency contacts to verify your safety.
              </p>
              
              {/* Graphic: Circular Timer mockup */}
              <div className={styles.featureGraphic}>
                <div className={styles.mockTimerContainer}>
                  <div className={styles.mockTimerRing}>
                    <Clock size={16} color="#0f75fc" />
                    <span>15:00</span>
                  </div>
                  <div className={styles.mockTimerLabel}>Did they arrive safely?</div>
                  <div className={styles.mockTimerActions}>
                    <span className={styles.mockTimerBtn}>YES</span>
                    <span className={styles.mockTimerBtn} style={{ borderColor: '#ef4444', color: '#ef4444' }}>NO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Community Data Engine */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardHeader}>
              <span className={styles.featureHashtag}>#CommunitySafety</span>
              <RouteLogo size={28} color="var(--color-text-primary)" lineColor="var(--color-background-surface)" />
            </div>
            
            <div className={styles.featureCardBody}>
              <h3 className={styles.featureHeadline}>Build collective intelligence to map transit risks.</h3>
              <p className={styles.featureDescription}>
                Every flagged vehicle report contributes to community intelligence, helping commuters identify high-risk travel corridors in Lagos.
              </p>
              
              {/* Graphic: Lagos Map Route wireframe */}
              <div className={styles.featureGraphic}>
                <div className={styles.mockMapContainer}>
                  <svg width="100%" height="80px" viewBox="0 0 100 40">
                    <circle cx="15" cy="20" r="2.5" fill="#22c55e" />
                    <circle cx="50" cy="15" r="2.5" fill="#f97316" />
                    <circle cx="85" cy="25" r="2.5" fill="#ef4444" />
                    <path d="M15 20 Q 50 15 85 25" fill="none" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="1.5" strokeDasharray="3 2" />
                    <path d="M15 20 L 50 15 L 85 25" fill="none" stroke="#ef4444" strokeWidth="1" />
                    <text x="12" y="32" fontSize="5" fill="var(--color-text-secondary)">Ikeja</text>
                    <text x="44" y="27" fontSize="5" fill="var(--color-text-secondary)">Maryland</text>
                    <text x="80" y="37" fontSize="5" fill="var(--color-text-secondary)">Yaba</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section id="about" className={styles.bentoSection}>
        <span className={styles.bentoLabel}>About Route</span>
        <h2 className={styles.bentoHeadline}>A community safety network dedicated to building a safer Lagos</h2>

        <div className={styles.bentoGrid}>
          {/* Card 1: 10k+ Commuters Protected */}
          <div className={`${styles.bentoCard} ${styles.bentoBlue}`}>
            <div>
              <img src="/illustrations/user_bridge.png" alt="Lekki Bridge" />
              <h3 className={styles.bentoTitle}>10,000+ Journeys Secured</h3>
              <p className={styles.bentoText}>We track transit safety records across primary travel corridors in Lagos to protect our community.</p>
            </div>
            <span style={{ fontSize: '0.875rem', opacity: '0.8', marginTop: '16px', display: 'block' }}>Active Commute Networks</span>
          </div>

          {/* Card 2: 100% Privacy Quote */}
          <div className={`${styles.bentoCard} ${styles.bentoGrey}`}>
            <div>
              <div className={styles.quoteIcon}>“</div>
              <p className={styles.quoteText}>
                The safety verification system has transformed how I commute. Searching license plates keeps me informed, while automated check-ins give my family peace of mind.
              </p>
            </div>
            <div>
              <p className={styles.quoteAuthor}>Lagos Commuter</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Ikeja to Lekki Commute</span>
            </div>
          </div>

          {/* Card 3: 500k+ GPS and 20+ LGAs (Right column group) */}
          <div className={styles.bentoRightCol}>
            <div className={styles.bentoLime}>
              <div>
                <strong className={styles.bentoNumber}>500k+</strong>
                <h3 className={styles.bentoTitle} style={{ fontSize: '1rem', marginBottom: '4px' }}>GPS Location Snapshots</h3>
              </div>
              <p className={styles.bentoText} style={{ fontSize: '0.8125rem' }}>
                Secure background updates are encrypted using AES-256-GCM and are only shared with your contacts during active trips.
              </p>
            </div>

            <div className={styles.bentoBlack}>
              <div>
                <strong className={styles.bentoNumber} style={{ fontSize: '2.5rem', color: 'hsl(76, 100%, 65%)' }}>20+</strong>
                <h3 className={styles.bentoTitle} style={{ fontSize: '0.875rem', marginBottom: '0', color: '#fff' }}>Local Governments Covered</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer in Sukoya Style */}
      <footer className={styles.footer}>
        {/* Scenery Background Image overlay */}
        <div className={styles.footerBgImage} />
        
        <div className={styles.footerContainer}>
          {/* Top row: Logo on left, Safety slogan on right */}
          <div className={styles.footerTopRow}>
            <Link href="/" className={styles.logoStacked} style={{ color: '#ffffff', margin: 0, alignItems: 'flex-start' }}>
              <RouteLogo size={68} color="#ffffff" lineColor="#000000" />
            </Link>
            <div className={styles.footerSlogan}>
              TRAVEL SMART. COMMUTE SAFELY.
            </div>
          </div>

          {/* Columns row */}
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
              <a href="https://termly.io" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Cookie Preferences</a>
              
              <button onClick={handleCTA} className={styles.footerPillBtn}>
                Get Started
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright & huge background stencil text */}
        <div className={styles.footerBottom}>
          <div className={styles.stencilContainer}>
            <span className={styles.stencilText}>ROUTE</span>
          </div>
          <span className={styles.copyright}>© 2026 Route App. Built by Abimbola. All rights reserved.</span>
        </div>
      </footer>

      {/* Desktop modal — rendered at root level to avoid overflow clipping */}
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

            {/* Header */}
            <div style={{ marginBottom: "16px" }}>
              <RouteLogo size={80} color="#ffffff" lineColor="#000000" />
            </div>
            <h3 className={styles.desktopModalTitle}>Route is a mobile app</h3>
            <p className={styles.desktopModalSub}>
              To secure your commutes with active GPS tracking, background safety timers, and instant plate lookups, Route is designed to run exclusively on mobile devices. Scan the QR code with your phone camera to open it.
            </p>

            {/* QR Code */}
            <div className={styles.desktopModalQR}>
              <QRCodeSVG
                value={typeof window !== "undefined" ? window.location.origin : "https://route.app"}
                size={180}
                bgColor="#ffffff"
                fgColor="#0a0a0a"
                level="M"
              />
            </div>

            {/* URL + copy */}
            <div className={styles.desktopModalUrl}>
              <span>{typeof window !== "undefined" ? window.location.origin : "route.app"}</span>
              <button onClick={handleCopyLink} className={styles.desktopModalCopyBtn}>
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
            <p className={styles.desktopModalHint}>
              After opening on your phone — tap <strong>Share → Add to Home Screen</strong> for the best experience.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
