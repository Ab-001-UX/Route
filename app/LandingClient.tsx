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
  ShieldAlert,
  Plus,
  Minus,
  Check,
  Lock,
  PhoneCall,
  Sparkles,
  Users,
  Compass
} from "lucide-react";
import styles from "./landing-page.module.css";
import RouteLogo from "@/components/ui/RouteLogo";
import { QRCodeSVG } from "qrcode.react";

const FAQ_ITEMS = [
  {
    question: "How does Route protect me before I board?",
    answer: "Route allows you to enter any commercial vehicle plate number (Danfo, Keke Marwa, Okada, Uber, or Taxi) before stepping inside. It instantly queries the community safety database to show if fellow Lagosians have reported previous safety concerns or dangerous behavior for that vehicle."
  },
  {
    question: "Do my loved ones need to install Route to view my trip summary?",
    answer: "No! When you tap 'Share on WhatsApp', Route generates a web summary link (e.g. route.app/trip/xyz). Anyone receiving your WhatsApp link can view the vehicle details, boarding point, destination, and Lagos emergency helpline numbers directly in their browser without downloading an app or signing up."
  },
  {
    question: "How does community vehicle flagging work?",
    answer: "To prevent false reports, Route uses a community verification threshold. When 3 or more independent commuters flag the same vehicle plate for safety concerns (such as route deviation, extortion, or threatening behavior), the vehicle is automatically assigned a prominent 'Community Flagged' warning badge."
  },
  {
    question: "Does Route track my live GPS location in the background?",
    answer: "No. Route is built with a zero-bloat, privacy-first philosophy. We do not track your location in the background, run battery-draining GPS services, or sell your private movement data. You control what trip details you log and share."
  },
  {
    question: "Is Route free to use for Lagos commuters?",
    answer: "Yes, Route is 100% free for all commuters across Lagos State. Our mission is to make daily transit safer and more transparent for everyone."
  }
];

export default function LandingClient() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [showDesktopPanel, setShowDesktopPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/home");
    }
  }, [isLoaded, isSignedIn, router]);

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

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className={styles.shell}>
      {/* SECTION 1: HERO & NAVBAR */}
      <section className={styles.heroSection}>
        {/* Navbar */}
        <header className={styles.navbar}>
          <Link href="/" className={styles.logoStacked} onClick={() => setMobileNavOpen(false)}>
            <RouteLogo size={52} color="#ffffff" lineColor="#0a0a0a" className={styles.navLogoDesktop} />
            <RouteLogo size={40} color="#ffffff" lineColor="#0a0a0a" className={styles.navLogoMobile} />
            <span className={styles.logoTextStacked}>Route</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <Link href="#features" className={styles.navLink}>Features</Link>
            <Link href="#about" className={styles.navLink}>About Route</Link>
            <Link href="#faq" className={styles.navLink}>FAQ</Link>
            <Link href="/privacy" className={styles.navLink}>Privacy</Link>
          </nav>

          <button onClick={handleCTA} className={styles.navCta}>
            Get Started <ArrowUpRight size={16} />
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            className={styles.hamburger}
            onClick={() => setMobileNavOpen(prev => !prev)}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X size={22} color="#ffffff" /> : <Menu size={22} color="#ffffff" />}
          </button>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileNavOpen && (
          <div className={styles.mobileDrawer}>
            <Link href="/" className={styles.mobileNavLink} onClick={() => setMobileNavOpen(false)}>Home</Link>
            <Link href="#features" className={styles.mobileNavLink} onClick={() => setMobileNavOpen(false)}>Features</Link>
            <Link href="#about" className={styles.mobileNavLink} onClick={() => setMobileNavOpen(false)}>About Route</Link>
            <Link href="#faq" className={styles.mobileNavLink} onClick={() => setMobileNavOpen(false)}>FAQ</Link>
            <Link href="/privacy" className={styles.mobileNavLink} onClick={() => setMobileNavOpen(false)}>Privacy</Link>
            <button onClick={() => { setMobileNavOpen(false); handleCTA(); }} className={styles.mobileNavCta}>
              Get Started <ArrowUpRight size={16} />
            </button>
          </div>
        )}

        {/* Hero Main Split Container */}
        <div className={styles.heroGrid}>
          {/* Left Column: Headline & Action */}
          <div className={styles.heroLeftCol}>
            <div className={styles.heroBadge}>
              <ShieldCheck size={16} color="hsl(76, 100%, 65%)" />
              <span>#1 Passive Safety PWA for Lagos Commuters</span>
            </div>

            <h1 className={styles.heroHeadline}>
              Check plates. Share your trip on WhatsApp. Stay safe.
            </h1>

            <p className={styles.heroSubtitle}>
              Every Lagos commute deserves peace of mind. Verify vehicle safety records before boarding any Danfo, Keke, or Taxi, and send a 1-tap trip summary link directly to loved ones on WhatsApp.
            </p>

            <div className={styles.heroButtons}>
              <button onClick={handleCTA} className={styles.primaryHeroBtn}>
                Get Started
                <ArrowUpRight size={18} />
              </button>
              <a href="#about" className={styles.secondaryHeroBtn}>
                How It Works
              </a>
            </div>

            {/* Ratings / Social Proof */}
            <div className={styles.trustRating}>
              <span>Trusted by commuters across all 20 Lagos LGAs</span>
              <div className={styles.stars}>
                <Star size={14} fill="#fbbf24" stroke="none" />
                <Star size={14} fill="#fbbf24" stroke="none" />
                <Star size={14} fill="#fbbf24" stroke="none" />
                <Star size={14} fill="#fbbf24" stroke="none" />
                <Star size={14} fill="#fbbf24" stroke="none" />
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Graphic Card */}
          <div className={styles.heroRightCol}>
            <div className={styles.heroCardPreview}>
              <div className={styles.heroCardHeader}>
                <div className={styles.heroCardDotRow}>
                  <span className={styles.dotRed} />
                  <span className={styles.dotYellow} />
                  <span className={styles.dotGreen} />
                </div>
                <span className={styles.heroCardBadge}>LIVE APP PREVIEW</span>
              </div>

              <div className={styles.heroCardBody}>
                {/* Search Bar Graphic */}
                <div className={styles.heroSearchGraphic}>
                  <Search size={16} color="#9ca3af" />
                  <span className={styles.heroSearchText}>BDG 419 AA</span>
                  <span className={styles.heroSearchPill}>VERIFIED</span>
                </div>

                {/* WhatsApp Message Preview Graphic */}
                <div className={styles.heroWaGraphic}>
                  <div className={styles.heroWaHeader}>
                    <MessageCircle size={15} color="#25D366" />
                    <strong>WhatsApp Trip Link</strong>
                  </div>
                  <p className={styles.heroWaText}>
                    "🚍 Boarding Yellow Danfo (BDG 419 AA) at Obalende. Track vehicle summary: https://route.app/trip/xyz"
                  </p>
                </div>

                {/* Safety Status Pill */}
                <div className={styles.heroSafetyBanner}>
                  <ShieldCheck size={18} color="#22c55e" />
                  <div>
                    <strong>Clean Safety Record</strong>
                    <span>No community safety flags registered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: SUPPORTED TRANSIT CATEGORIES */}
      <section className={styles.logosSection}>
        <span className={styles.logosTitle}>Supported Commercial Transit Categories</span>
        <div className={styles.logosRow}>
          <div className={styles.logoItem}><span>Danfo Buses</span></div>
          <div className={styles.logoItem}><span>Keke Marwa</span></div>
          <div className={styles.logoItem}><span>Okada Bikes</span></div>
          <div className={styles.logoItem}><span>Uber / Taxi</span></div>
          <div className={styles.logoItem}><span>Shuttle Buses</span></div>
        </div>
      </section>

      {/* SECTION 3: FEATURES GRID (4 CARDS MATCHING WIREFRAME) */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresHeader}>
          <span className={styles.bentoLabel}>Core Features</span>
          <h2 className={styles.bentoHeadline}>Simple, powerful tools for safer commuting</h2>
          <p className={styles.featuresSubheadline}>
            Designed specifically for fast-paced Lagos transit without heavy downloads or intrusive permissions.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {/* Feature 1 */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardHeader}>
              <span className={styles.featureHashtag}>#PlateLookup</span>
              <RouteLogo size={28} color="var(--color-brand-primary)" lineColor="#ffffff" />
            </div>
            
            <div className={styles.featureCardBody}>
              <h3 className={styles.featureHeadline}>Search vehicle history before boarding.</h3>
              <p className={styles.featureDescription}>
                Instantly check if a plate has been flagged by fellow commuters for safety issues or reckless driving before you step inside.
              </p>
              
              <div className={styles.featureGraphic}>
                <div className={styles.mockLookupBar}>
                  <Search size={14} color="#6b7280" />
                  <span>BDG 419 AA</span>
                </div>
                <div className={styles.mockWarningToast}>
                  <AlertOctagon size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div className={styles.toastContent}>
                    <strong className={styles.toastTitle}>Flagged – Caution</strong>
                    <span className={styles.toastSubtext}>Community reported safety concern</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardHeader}>
              <span className={styles.featureHashtag}>#WhatsAppShare</span>
              <RouteLogo size={28} color="var(--color-brand-primary)" lineColor="#ffffff" />
            </div>
            
            <div className={styles.featureCardBody}>
              <h3 className={styles.featureHeadline}>1-Tap trip sharing on WhatsApp.</h3>
              <p className={styles.featureDescription}>
                Log your plate and route details in under 10 seconds. Generate a clean summary link and send it directly to family or group chats.
              </p>
              
              <div className={styles.featureGraphic}>
                <div className={styles.mockNotification}>
                  <div className={styles.notificationHeader}>
                    <MessageCircle size={15} color="#25D366" />
                    <strong>WhatsApp Message</strong>
                    <span>Just now</span>
                  </div>
                  <p className={styles.notificationText}>
                    "🚍 Boarding a Yellow Danfo (LND 123 XY) from Obalende to Lekki. Summary link: https://route.app/trip/xyz"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 — FIX CONTRAST BUG (DARK HIGH CONTRAST TEXT) */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardHeader}>
              <span className={styles.featureHashtag}>#CommunityWatch</span>
              <RouteLogo size={28} color="var(--color-brand-primary)" lineColor="#ffffff" />
            </div>
            
            <div className={styles.featureCardBody}>
              <h3 className={styles.featureHeadline}>Report & warn fellow Lagosians anonymously.</h3>
              <p className={styles.featureDescription}>
                Spotted a dangerous or suspicious vehicle? Submit an anonymous report to warn commuters across Lagos without exposing personal info.
              </p>
              
              <div className={styles.featureGraphic}>
                <div className={styles.mockFlagCard}>
                  <ShieldAlert size={22} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div className={styles.mockFlagContent}>
                    <strong className={styles.mockFlagTitle}>3+ Independent Reports = Flagged Badge</strong>
                    <span className={styles.mockFlagSub}>Verified community safety alert</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardHeader}>
              <span className={styles.featureHashtag}>#PrivacyFirst</span>
              <RouteLogo size={28} color="var(--color-brand-primary)" lineColor="#ffffff" />
            </div>
            
            <div className={styles.featureCardBody}>
              <h3 className={styles.featureHeadline}>Zero background location tracking.</h3>
              <p className={styles.featureDescription}>
                Route operates without battery-draining background GPS services or mandatory 3-contact lists. Pure, passive safety control in your hands.
              </p>
              
              <div className={styles.featureGraphic}>
                <div className={styles.mockPrivacyBox}>
                  <Lock size={18} color="#22c55e" />
                  <div>
                    <strong className={styles.mockPrivacyTitle}>100% Privacy Control</strong>
                    <span className={styles.mockPrivacySub}>No background tracking or contact sync</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: ABOUT ROUTE (SPLIT LAYOUT: BRIDGE IMAGE ON LEFT, TEXT ON RIGHT) */}
      <section id="about" className={styles.aboutSection}>
        <div className={styles.aboutContainer}>
          {/* Left Column: Bridge Image */}
          <div className={styles.aboutImageCol}>
            <div className={styles.aboutImageFrame}>
              <img 
                src="/illustrations/user_bridge.png" 
                alt="Lekki-Ikoyi Link Bridge Lagos" 
                className={styles.aboutBridgeImg}
              />
              <div className={styles.aboutImageBadge}>
                <Compass size={16} color="hsl(76, 100%, 65%)" />
                <span>Lagos Transit Safety Network</span>
              </div>
            </div>
          </div>

          {/* Right Column: Story & Purpose */}
          <div className={styles.aboutTextCol}>
            <span className={styles.bentoLabel}>About Route</span>
            <h2 className={styles.aboutHeadline}>The Story Behind Route & Why It Exists</h2>
            
            <p className={styles.aboutBodyText}>
              Route was born on the bustling streets of Lagos out of a real, urgent need for commuter peace of mind. Every day, millions of Lagosians board Danfo buses, Keke Marwas, Okada bikes, Uber rides, and shuttle buses—navigating unpredictable traffic, unverified vehicles, and the constant threat of "one-chance" syndicates.
            </p>

            <p className={styles.aboutBodyText}>
              We created Route as a lightweight, non-intrusive safety net. It allows everyday commuters to instantly check vehicle plate safety records before stepping inside, log ride details in under 10 seconds, and share a 1-tap WhatsApp summary link with loved ones—without cumbersome tracking apps or notification bloat.
            </p>

            <div className={styles.aboutHighlightsList}>
              <div className={styles.aboutHighlightItem}>
                <div className={styles.highlightCheckIcon}>
                  <Check size={16} color="#0d0d0d" />
                </div>
                <div>
                  <strong>Verified Community Records</strong>
                  <p>Check vehicle flags reported by fellow Lagos commuters before boarding.</p>
                </div>
              </div>

              <div className={styles.aboutHighlightItem}>
                <div className={styles.highlightCheckIcon}>
                  <Check size={16} color="#0d0d0d" />
                </div>
                <div>
                  <strong>1-Tap WhatsApp Summary</strong>
                  <p>Loved ones open your trip details in their browser with zero sign-up required.</p>
                </div>
              </div>

              <div className={styles.aboutHighlightItem}>
                <div className={styles.highlightCheckIcon}>
                  <Check size={16} color="#0d0d0d" />
                </div>
                <div>
                  <strong>Privacy & Simplicity First</strong>
                  <p>No continuous GPS tracking, no forced contact lists, and zero battery drain.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: REVIEWS / TESTIMONIALS */}
      <section className={styles.reviewsSection}>
        <div className={styles.featuresHeader}>
          <span className={styles.bentoLabel}>Commuter Feedback</span>
          <h2 className={styles.bentoHeadline}>Loved by everyday commuters across Lagos</h2>
        </div>

        <div className={styles.reviewsGrid}>
          <div className={styles.reviewCard}>
            <div className={styles.reviewStars}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#fbbf24" stroke="none" />
              ))}
            </div>
            <p className={styles.reviewText}>
              "Being able to search plate numbers before boarding Danfos at Yaba and send a quick WhatsApp summary to my family gives me complete peace of mind."
            </p>
            <div className={styles.reviewAuthorRow}>
              <div className={styles.reviewAvatar}>FA</div>
              <div>
                <strong className={styles.authorName}>Funmi A.</strong>
                <span className={styles.authorSub}>Yaba to Lekki Commuter</span>
              </div>
            </div>
          </div>

          <div className={styles.reviewCard}>
            <div className={styles.reviewStars}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#fbbf24" stroke="none" />
              ))}
            </div>
            <p className={styles.reviewText}>
              "I take Keke Marwa late at night from Ikeja station. Route lets me log the trip in 5 seconds and send the WhatsApp link directly to our family group chat."
            </p>
            <div className={styles.reviewAuthorRow}>
              <div className={styles.reviewAvatar}>EO</div>
              <div>
                <strong className={styles.authorName}>Emeka O.</strong>
                <span className={styles.authorSub}>Ikeja Night Commuter</span>
              </div>
            </div>
          </div>

          <div className={styles.reviewCard}>
            <div className={styles.reviewStars}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#fbbf24" stroke="none" />
              ))}
            </div>
            <p className={styles.reviewText}>
              "Simple, fast, and no unnecessary pop-ups or notifications. It is the cleanest and most practical transit safety app I have used in Lagos."
            </p>
            <div className={styles.reviewAuthorRow}>
              <div className={styles.reviewAvatar}>TK</div>
              <div>
                <strong className={styles.authorName}>Tolu K.</strong>
                <span className={styles.authorSub}>Victoria Island Commuter</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: FAQ ACCORDION SECTION */}
      <section id="faq" className={styles.faqSection}>
        <div className={styles.featuresHeader}>
          <span className={styles.bentoLabel}>FAQ</span>
          <h2 className={styles.bentoHeadline}>Confidently move forward with smart answers</h2>
        </div>

        <div className={styles.faqList}>
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx} 
                className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ""}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className={styles.faqQuestionRow}>
                  <h3 className={styles.faqQuestion}>{item.question}</h3>
                  <button className={styles.faqToggleBtn} aria-label="Toggle answer">
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </button>
                </div>
                {isOpen && (
                  <div className={styles.faqAnswer}>
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 7: FINAL CTA BANNER */}
      <section className={styles.ctaBannerSection}>
        <div className={styles.ctaBannerCard}>
          <div className={styles.ctaBannerContent}>
            <Sparkles size={28} color="hsl(76, 100%, 65%)" style={{ marginBottom: "12px" }} />
            <h2 className={styles.ctaBannerHeading}>Ready for safer commutes across Lagos?</h2>
            <p className={styles.ctaBannerSub}>
              Join thousands of Lagosians checking plates and sharing WhatsApp trip summaries every day.
            </p>
            <button onClick={handleCTA} className={styles.ctaBannerBtn}>
              Get Started Now
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 8: FOOTER (LARGER BRANDING & COMPLETE LINKS) */}
      <footer className={styles.footer}>
        <div className={styles.footerBgImage} />
        
        <div className={styles.footerContainer}>
          {/* Top Row: Larger Route Branding */}
          <div className={styles.footerTopRow}>
            <div className={styles.footerBrandBlock}>
              <Link href="/" className={styles.footerLogoLink}>
                <RouteLogo size={84} color="#ffffff" lineColor="#000000" />
                <span className={styles.footerBrandTitle}>ROUTE</span>
              </Link>
              <p className={styles.footerBrandTagline}>
                CHECK PLATES. SHARE TRIPS. COMMUTE SAFELY.
              </p>
            </div>
          </div>

          {/* 3 Columns Footer Links */}
          <div className={styles.footerColsRow}>
            <div className={styles.footerLinksCol}>
              <h4 className={styles.footerColTitle}>Navigation</h4>
              <Link href="/" className={styles.footerLink}>Home</Link>
              <Link href="#features" className={styles.footerLink}>Features</Link>
              <Link href="#about" className={styles.footerLink}>About Route</Link>
              <Link href="#faq" className={styles.footerLink}>FAQ</Link>
            </div>

            <div className={styles.footerLinksCol}>
              <h4 className={styles.footerColTitle}>Emergency Helplines</h4>
              <a href="tel:767" className={styles.footerLink}>
                <PhoneCall size={14} style={{ marginRight: '6px' }} /> LASEMA Emergency (767)
              </a>
              <a href="tel:112" className={styles.footerLink}>
                <PhoneCall size={14} style={{ marginRight: '6px' }} /> Police Hotline (112)
              </a>
            </div>

            <div className={styles.footerLinksCol}>
              <h4 className={styles.footerColTitle}>Legal & App</h4>
              <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
              
              <button onClick={handleCTA} className={styles.footerPillBtn}>
                Get Started
              </button>
            </div>
          </div>
        </div>

        {/* Footer Stencil & Copyright */}
        <div className={styles.footerBottom}>
          <div className={styles.stencilContainer}>
            <span className={styles.stencilText}>ROUTE</span>
          </div>
          <span className={styles.copyright}>
            © 2026 Route App. Built by Abimbola for Lagos Commuters. All rights reserved.
          </span>
        </div>
      </footer>

      {/* DESKTOP OPEN ON PHONE MODAL */}
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
