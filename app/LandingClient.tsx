"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { 
  ArrowUpRight, 
  Search, 
  MessageCircle, 
  ShieldAlert, 
  Star, 
  X, 
  Menu,
  Plus,
  Minus,
  Check,
  Lock,
  PhoneCall,
  Sparkles,
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
            <Link href="#how-it-works" className={styles.navLink}>How It Works</Link>
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
            <Link href="#how-it-works" className={styles.mobileNavLink} onClick={() => setMobileNavOpen(false)}>How It Works</Link>
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
            <h1 className={styles.heroHeadline}>
              Check plates. Share your trip on WhatsApp. Stay safe.
            </h1>

            <p className={styles.heroSubtitle}>
              Don't board blind in Lagos. Look up vehicle safety records before stepping inside any Danfo, Keke, or Taxi, and send your ride details straight to family on WhatsApp.
            </p>

            <div className={styles.heroButtons}>
              <button onClick={handleCTA} className={styles.primaryHeroBtn}>
                Get Started
                <ArrowUpRight size={18} />
              </button>
              <a href="#how-it-works" className={styles.secondaryHeroBtn}>
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

          {/* Right Column: Phone Mockup with Image 3 App Screenshot */}
          <div className={styles.heroRightCol}>
            <div className={styles.phoneMockupFrame}>
              <div className={styles.phoneDynamicIsland} />
              <div className={styles.phoneScreenContainer}>
                <img 
                  src="/screenshots/hero_phone.jpg" 
                  alt="Route Mobile App Screen" 
                  className={styles.phoneAppImage}
                />
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

      {/* SECTION 3: HOW ROUTE WORKS (IMAGE 2 STYLE: "USER GUIDE FOR FIRST TIMER") */}
      <section id="how-it-works" className={styles.howItWorksSection}>
        <div className={styles.guideCard}>
          <div className={styles.guideLeftCol}>
            <h2 className={styles.guideTitle}>User guide for first timer</h2>
          </div>
          
          <div className={styles.guideVerticalLine} />

          <div className={styles.guideRightCol}>
            <div className={styles.guideStepItem}>
              <h3 className={styles.guideStepNumber}>Step 1</h3>
              <p className={styles.guideStepText}>
                <strong>Search Plate</strong> — Type in the plate number at the bus stop to check previous driver flags.
              </p>
            </div>

            <div className={styles.guideStepItem}>
              <h3 className={styles.guideStepNumber}>Step 2</h3>
              <p className={styles.guideStepText}>
                <strong>Log Trip</strong> — Pick your ride type, where you're entering, and where you're heading.
              </p>
            </div>

            <div className={styles.guideStepItem}>
              <h3 className={styles.guideStepNumber}>Step 3</h3>
              <p className={styles.guideStepText}>
                <strong>Share Link</strong> — Tap once to copy a clean summary link and drop it into WhatsApp.
              </p>
            </div>

            <div className={styles.guideStepItem}>
              <h3 className={styles.guideStepNumber}>Step 4</h3>
              <p className={styles.guideStepText}>
                <strong>Family Stays Updated</strong> — Your people open the link in any browser. Zero sign-up needed on their end.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CORE FEATURES (MATCHING USER IMAGE: 3 HORIZONTAL STEPS WITH CONNECTING WAVY LINE & SQUIRCLE ICONS) */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionCenteredHeader}>
          <span className={styles.bentoLabel}>Core Features</span>
          <h2 className={styles.bentoHeadline}>Built for fast-paced Lagos commuting</h2>
          <p className={styles.featuresSubheadline}>
            No app downloads for your contacts, no location tracking, and zero clutter.
          </p>
        </div>

        <div className={styles.flowContainer}>
          {/* Step 1 */}
          <div className={styles.flowStep}>
            <div className={styles.flowIconBox}>
              <Search size={32} color="var(--color-text-primary)" />
            </div>
            <h3 className={styles.flowStepTitle}>Search Vehicle Plate</h3>
            <p className={styles.flowStepDescription}>
              Look up any Danfo, Keke, Okada, or Taxi plate number to see previous community safety reports.
            </p>
          </div>

          {/* Curved Connector Line 1 */}
          <div className={styles.waveConnectorBox}>
            <svg className={styles.waveConnectorSvg} viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 5 20 Q 40 5, 80 20 T 155 20" stroke="var(--color-border-default)" strokeWidth="2.5" strokeDasharray="6 6" />
            </svg>
          </div>

          {/* Step 2 */}
          <div className={styles.flowStep}>
            <div className={styles.flowIconBox}>
              <MessageCircle size={32} color="var(--color-text-primary)" />
            </div>
            <h3 className={styles.flowStepTitle}>1-Tap WhatsApp Share</h3>
            <p className={styles.flowStepDescription}>
              Send your vehicle details, trip route, and emergency numbers directly to family on WhatsApp.
            </p>
          </div>

          {/* Curved Connector Line 2 */}
          <div className={styles.waveConnectorBox}>
            <svg className={styles.waveConnectorSvg} viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 5 20 Q 40 35, 80 20 T 155 20" stroke="var(--color-border-default)" strokeWidth="2.5" strokeDasharray="6 6" />
            </svg>
          </div>

          {/* Step 3 */}
          <div className={styles.flowStep}>
            <div className={styles.flowIconBox}>
              <ShieldAlert size={32} color="var(--color-text-primary)" />
            </div>
            <h3 className={styles.flowStepTitle}>Community Safety Watch</h3>
            <p className={styles.flowStepDescription}>
              Report reckless drivers or unsafe vehicles anonymously so fellow commuters stay warned.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: ABOUT ROUTE (SEPARATED WITH CENTERED HEADING & SPLIT CONTENT BELOW) */}
      <section id="about" className={styles.aboutSection}>
        <div className={styles.sectionCenteredHeader}>
          <span className={styles.bentoLabel}>About Route</span>
          <h2 className={styles.bentoHeadline}>Why we built Route for Lagos</h2>
        </div>

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
                <Compass size={16} color="#ffffff" />
                <span>Lagos Transit Safety Network</span>
              </div>
            </div>
          </div>

          {/* Right Column: Story & Purpose */}
          <div className={styles.aboutTextCol}>
            <p className={styles.aboutBodyText}>
              Route was built directly on the streets of Lagos to tackle a daily reality every commuter knows too well. From rush-hour Danfos at CMS to late-night Kekes in Ikeja, millions of us get into vehicles without knowing who's at the wheel or if the car is safe.
            </p>

            <p className={styles.aboutBodyText}>
              We built Route as a straightforward, lightweight tool: search a plate at the bus stop, save your ride info, and text a summary link to your family. No battery-draining background tracking, no forced emergency contact setup, and no useless notification popups.
            </p>

            <div className={styles.aboutHighlightsList}>
              <div className={styles.aboutHighlightItem}>
                <div className={styles.highlightCheckIcon}>
                  <Check size={16} color="#ffffff" />
                </div>
                <div>
                  <strong>Verified Community Records</strong>
                  <p>Check vehicle flags reported by fellow Lagos commuters before boarding.</p>
                </div>
              </div>

              <div className={styles.aboutHighlightItem}>
                <div className={styles.highlightCheckIcon}>
                  <Check size={16} color="#ffffff" />
                </div>
                <div>
                  <strong>1-Tap WhatsApp Summary</strong>
                  <p>Loved ones open your trip details in their browser with zero sign-up required.</p>
                </div>
              </div>

              <div className={styles.aboutHighlightItem}>
                <div className={styles.highlightCheckIcon}>
                  <Check size={16} color="#ffffff" />
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

      {/* SECTION 6: REVIEWS / TESTIMONIALS */}
      <section className={styles.reviewsSection}>
        <div className={styles.sectionCenteredHeader}>
          <span className={styles.bentoLabel}>Commuter Feedback</span>
          <h2 className={styles.bentoHeadline}>What Lagosians are saying</h2>
        </div>

        <div className={styles.reviewsGrid}>
          <div className={styles.reviewCard}>
            <div className={styles.reviewStars}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#fbbf24" stroke="none" />
              ))}
            </div>
            <p className={styles.reviewText}>
              "Before getting into any Danfo at Yaba, I check the plate on Route first and drop the link in our family group chat. It keeps everyone in the loop without stressing anyone out."
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
              "I take Keke Marwa late at night around Ikeja bus stop. I log the plate in 5 seconds and send the WhatsApp link to my sister so she knows I'm on my way."
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
              "What I love is that my mother doesn't need to download anything. She just taps the WhatsApp link and sees the bus details right in her phone browser."
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

      {/* SECTION 7: FAQ ACCORDION SECTION */}
      <section id="faq" className={styles.faqSection}>
        <div className={styles.sectionCenteredHeader}>
          <span className={styles.bentoLabel}>FAQ</span>
          <h2 className={styles.bentoHeadline}>Frequently Asked Questions</h2>
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

      {/* SECTION 8: FINAL CTA BANNER */}
      <section className={styles.ctaBannerSection}>
        <div className={styles.ctaBannerCard}>
          <div className={styles.ctaBannerContent}>
            <Sparkles size={28} color="#ffffff" style={{ marginBottom: "12px" }} />
            <h2 className={styles.ctaBannerHeading}>Commute with confidence across Lagos</h2>
            <p className={styles.ctaBannerSub}>
              Search plates, log your ride, and keep your family updated in seconds.
            </p>
            <button onClick={handleCTA} className={styles.ctaBannerBtn}>
              Get Started Now
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 9: FOOTER (LARGER BRANDING & COMPLETE LINKS) */}
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
              <Link href="#how-it-works" className={styles.footerLink}>How It Works</Link>
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
