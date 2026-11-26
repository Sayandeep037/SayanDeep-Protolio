import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  BANNER_NAV_ITEMS,
  DetailSection,
  PORTFOLIO_IDENTITY,
} from './data/portfolioData';
import { GlassReflectionPage } from './components/GlassReflectionPage';
import type { GlassHeroSceneController, HeroPhase } from './three/GlassHeroScene';
import {
  getBannerNavLayout,
  getPortraitFrameRect,
  getWrappedLineCount,
} from './three/glassLayout';

const VALID_SECTIONS: DetailSection[] = ['about', 'services', 'portfolio', 'contact'];
const AboutPage = lazy(() => import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((module) => ({ default: module.ContactPage })));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').then((module) => ({ default: module.PortfolioPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then((module) => ({ default: module.ServicesPage })));

function parseHashSection(): DetailSection | null {
  const hash = window.location.hash.replace(/^#/, '').toLowerCase();
  return VALID_SECTIONS.includes(hash as DetailSection)
    ? (hash as DetailSection)
    : null;
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<GlassHeroSceneController | null>(null);
  const navLayerRef = useRef<HTMLDivElement | null>(null);
  const panelLayerRef = useRef<HTMLDivElement | null>(null);
  const pageScrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<DetailSection, HTMLElement | null>>({
    about: null,
    services: null,
    portfolio: null,
    contact: null,
  });

  const [phase, setPhase] = useState<HeroPhase>('entering');
  const [activeSection, setActiveSection] = useState<DetailSection>('about');
  const [contextLost, setContextLost] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showDefinitions, setShowDefinitions] = useState(false);
  const [panelDims, setPanelDims] = useState({
    navW: 1280,
    navH: 86,
    panelW: 1280,
    panelH: 700,
    S: 1280 / 1730,
  });

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(prefersReduced);
    if (prefersReduced) {
      setPhase('idle');
      return;
    }

    const mount = canvasMountRef.current;
    if (!mount) return;

    let cancelled = false;
    let controller: GlassHeroSceneController | null = null;

    void import('./three/GlassHeroScene').then(({ GlassHeroSceneController }) => {
      if (cancelled) return;

      controller = new GlassHeroSceneController(mount, {
        onPhaseChange: (nextPhase) => {
          setPhase(nextPhase);
        },
        onHomographyUpdate: (navMatrix, panelMatrix, navW, navH, panelW, panelH) => {
          if (navLayerRef.current) {
            navLayerRef.current.style.transform = navMatrix;
            navLayerRef.current.style.width = `${navW}px`;
            navLayerRef.current.style.height = `${navH}px`;
          }
          if (panelLayerRef.current) {
            panelLayerRef.current.style.transform = panelMatrix;
            panelLayerRef.current.style.width = `${panelW}px`;
            panelLayerRef.current.style.height = `${panelH}px`;
          }
          setPanelDims((prev) => {
            if (
              Math.abs(prev.panelW - panelW) < 1 &&
              Math.abs(prev.panelH - panelH) < 1
            ) {
              return prev;
            }
            return {
              navW,
              navH,
              panelW,
              panelH,
              S: panelW / 1730,
            };
          });
        },
        onBackSliverHoverChange: () => {},
        onBackSliverClick: () => {
          if (window.location.hash && window.location.hash !== '#home') {
            window.history.replaceState(null, '', '#home');
          }
          setShowDefinitions(false);
          window.setTimeout(() => {
            sceneRef.current?.reassemble();
          }, 60);
        },
        onContextLostChange: setContextLost,
      });

      sceneRef.current = controller;
      const portraitImage = new Image();
      portraitImage.onload = () => {
        if (!cancelled) {
          controller?.setPortraitImage(portraitImage);
        }
      };
      portraitImage.src = `${import.meta.env.BASE_URL}sayandeep_professional_pfp.jpg`;
    });

    return () => {
      cancelled = true;
      controller?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const scrollToSection = useCallback(
    (section: DetailSection, behavior: ScrollBehavior = 'smooth', attempt = 0) => {
      const targetEl = sectionRefs.current[section];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior, block: 'start' });
      } else if (attempt < 6) {
        window.requestAnimationFrame(() => scrollToSection(section, behavior, attempt + 1));
      } else {
        pageScrollRef.current?.scrollTo({ top: 0, behavior });
      }
    },
    []
  );

  const triggerShatter = useCallback(
    (section: DetailSection) => {
      setActiveSection(section);
      if (window.location.hash !== `#${section}`) {
        window.history.pushState(null, '', `#${section}`);
      }
      if (reducedMotion || contextLost) {
        setPhase('shattered');
        setShowDefinitions(true);
        window.requestAnimationFrame(() => scrollToSection(section, 'smooth'));
        return;
      }
      sceneRef.current?.shatter();
      window.setTimeout(() => {
        setShowDefinitions(true);
        window.requestAnimationFrame(() =>
          scrollToSection(section, section === 'about' ? 'auto' : 'smooth')
        );
      }, 260);
    },
    [reducedMotion, contextLost, scrollToSection]
  );

  const navigatePage = useCallback(
    (section: DetailSection) => {
      setActiveSection(section);
      if (window.location.hash !== `#${section}`) {
        window.history.pushState(null, '', `#${section}`);
      }
      scrollToSection(section, 'smooth');
    },
    [scrollToSection]
  );

  const triggerBack = useCallback(() => {
    setShowDefinitions(false);
    if (window.location.hash && window.location.hash !== '#home') {
      window.history.pushState(null, '', '#home');
    }
    if (reducedMotion || contextLost) {
      setPhase('idle');
      return;
    }
    window.setTimeout(() => {
      sceneRef.current?.reassemble();
    }, 60);
  }, [reducedMotion, contextLost]);

  useEffect(() => {
    const initialSection = parseHashSection();
    if (initialSection) {
      setActiveSection(initialSection);
      sceneRef.current?.shatter();
      setShowDefinitions(true);
      window.setTimeout(() => scrollToSection(initialSection, 'auto'), 80);
    }

    const handleHashChange = () => {
      const target = parseHashSection();
      if (target) {
        setActiveSection(target);
        if (!reducedMotion && !contextLost) {
          sceneRef.current?.shatter();
        } else {
          setPhase('shattered');
        }
        setShowDefinitions(true);
        window.setTimeout(() => scrollToSection(target, 'smooth'), 60);
      } else {
        setShowDefinitions(false);
        if (reducedMotion || contextLost) {
          setPhase('idle');
        } else {
          window.setTimeout(() => {
            sceneRef.current?.reassemble();
          }, 60);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [reducedMotion, contextLost, scrollToSection]);

  // Allow scrolling down from Home to shatter seamlessly into About -> Services -> Portfolio -> Contact
  useEffect(() => {
    if (showDefinitions || phase !== 'idle') return;
    let triggered = false;
    const handleWheel = (e: WheelEvent) => {
      if (!triggered && e.deltaY > 36) {
        triggered = true;
        triggerShatter('about');
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [showDefinitions, phase, triggerShatter]);

  // Keep sticky nav active indicator synced with visible sequential page
  useEffect(() => {
    const root = pageScrollRef.current;
    if (!showDefinitions || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestSection: DetailSection | null = null;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            const sec = (entry.target as HTMLElement).dataset.section as
              | DetailSection
              | undefined;
            if (sec) {
              bestRatio = entry.intersectionRatio;
              bestSection = sec;
            }
          }
        }
        if (bestSection) {
          setActiveSection(bestSection);
        }
      },
      {
        root,
        threshold: [0.15, 0.35, 0.6],
      }
    );

    for (const sec of VALID_SECTIONS) {
      const el = sectionRefs.current[sec];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [showDefinitions]);

  const S = panelDims.S;
  const leftX = Math.max(20, 62 * S);
  const bottomPad = Math.max(18, 38 * S);
  const portraitRect = getPortraitFrameRect(panelDims.panelW, panelDims.panelH, S);
  const navLayout = getBannerNavLayout(panelDims.navW, S);

  const eyebrowY = panelDims.panelH * 0.135;
  const eyebrowSize = 16;
  const headSize = Math.min(panelDims.panelW * 0.078, panelDims.panelH * 0.2);
  const headLeading = headSize * 0.97;
  const headY = eyebrowY + eyebrowSize + Math.max(14, 26 * S);
  const subSize = 15.5;
  const subY = headY + headLeading * 2 + Math.max(14, 24 * S);
  const subMaxW = portraitRect.visible
    ? Math.max(220, portraitRect.x - leftX - Math.max(20, 28 * S))
    : Math.max(220, panelDims.panelW - leftX * 2);
  const subText = [PORTFOLIO_IDENTITY.subLine1, PORTFOLIO_IDENTITY.subLine2]
    .filter(Boolean)
    .join(' ');
  const subLineCount = getWrappedLineCount(subText, subSize, subMaxW);
  const ctaY = subY + subLineCount * (subSize * 1.45) + Math.max(16, 26 * S);
  const pillW = Math.max(146, 174 * S);
  const pillH = Math.max(36, 44 * S);

  const isHeroInteractive = phase === 'idle';
  const isShatteredView = phase === 'shattering' || phase === 'shattered';

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        className="fixed inset-0 z-0"
        aria-hidden="true"
      />

      {/* Reduced-Motion / Fallback Static Hero */}
      {(reducedMotion || contextLost) && !isShatteredView && (
        <div className="fixed inset-0 z-10 flex flex-col justify-center items-center p-6 sm:p-12">
          <div className="w-full max-w-5xl space-y-4">
            <div className="bg-[#0b1410]/95 border border-[#1f362b] rounded-2xl px-7 py-4 flex items-center justify-center">
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-base font-semibold text-white/85">
                {BANNER_NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      item.id === 'home' ? triggerBack() : triggerShatter(item.id)
                    }
                    className={`cursor-pointer transition-colors ${
                      item.id === 'home'
                        ? 'text-white'
                        : 'hover:text-[#36d67e]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#0b1410]/95 border border-[#1f362b] rounded-2xl p-8 sm:p-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[#68e8a0] uppercase mb-6">
                  {PORTFOLIO_IDENTITY.eyebrow}
                </p>
                <h1 className="text-5xl sm:text-7xl font-semibold tracking-[-0.045em] leading-[0.97] text-white mb-6">
                  {PORTFOLIO_IDENTITY.headlineLine1}
                  <br />
                  {PORTFOLIO_IDENTITY.headlineLine2}
                </h1>
                <p className="text-lg font-medium text-white/85 max-w-xl mb-8">
                  {PORTFOLIO_IDENTITY.subLine1} {PORTFOLIO_IDENTITY.subLine2}
                </p>
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => triggerShatter('portfolio')}
                    className="glass-pill-btn px-5 py-2.5 rounded-md text-sm font-medium cursor-pointer"
                  >
                    {PORTFOLIO_IDENTITY.primaryCta}
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerShatter('about')}
                    className="glass-link text-sm font-medium cursor-pointer"
                  >
                    {PORTFOLIO_IDENTITY.secondaryCta}
                  </button>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center">
                <div className="relative w-48 h-56 overflow-hidden">
                  <img
                    src={`${import.meta.env.BASE_URL}sayandeep_professional_pfp.jpg`}
                    alt="Sayan Deep Roy"
                    className="w-full h-full object-cover object-[50%_28%] opacity-90 contrast-110 brightness-90 saturate-75"
                    style={{
                      WebkitMaskImage:
                        'radial-gradient(ellipse 74% 78% at 50% 46%, #000 45%, transparent 98%)',
                      maskImage:
                        'radial-gradient(ellipse 74% 78% at 50% 46%, #000 45%, transparent 98%)',
                    }}
                  />
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(ellipse 74% 78% at 50% 46%, rgba(18,64,42,0.2) 0%, rgba(11,20,16,0.75) 95%)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Homography-Mapped Interactive & Selectable DOM Layer (matches 3D tilted slab) */}
      {!reducedMotion && !contextLost && (
        <div
          className={`fixed inset-0 z-10 pointer-events-none transition-opacity duration-150 ${
            isHeroInteractive ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Nav Homography Layer (Only: Home, About, Services, Portfolio, Contact) */}
          <div
            ref={navLayerRef}
            className="homography-layer pointer-events-none"
          >
            <div className="relative w-full h-full">
              {BANNER_NAV_ITEMS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    item.id === 'home' ? triggerBack() : triggerShatter(item.id)
                  }
                  className="absolute top-0 bottom-0 pointer-events-auto cursor-pointer flex items-center justify-center font-medium opacity-0 hover:opacity-100 text-[#36d67e] bg-[#0b1912]/80 rounded-lg transition-opacity duration-150"
                  style={{
                    left: navLayout.centersX[idx] - navLayout.slotWidth * 0.45,
                    width: navLayout.slotWidth * 0.9,
                    fontSize: idx === 0 ? '16px' : navLayout.fontSize,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel Homography Layer */}
          <div
            ref={panelLayerRef}
            className="homography-layer pointer-events-none"
          >
            <div className="relative w-full h-full">
              {/* Selectable Eyebrow */}
              <div
                className="absolute select-text pointer-events-auto text-transparent"
                style={{
                  left: leftX,
                  top: eyebrowY,
                  fontSize: '16px',
                  letterSpacing: '0.2em',
                }}
              >
                {PORTFOLIO_IDENTITY.eyebrow}
              </div>

              {/* Selectable Headline */}
              <h1
                className="absolute select-text pointer-events-auto text-transparent font-medium"
                style={{
                  left: leftX,
                  top: headY,
                  fontSize: headSize,
                  lineHeight: 0.97,
                  letterSpacing: '-0.045em',
                }}
              >
                {PORTFOLIO_IDENTITY.headlineLine1}
                <br />
                {PORTFOLIO_IDENTITY.headlineLine2}
              </h1>

              {/* Selectable Subtitle */}
              <p
                className="absolute select-text pointer-events-auto text-transparent font-medium"
                style={{
                  left: leftX,
                  top: subY,
                  maxWidth: subMaxW,
                  fontSize: '15.5px',
                  lineHeight: 1.45,
                }}
              >
                {subText}
              </p>

              {/* Interactive "Open studio" Pill (turns #36d67e green on hover) */}
              <button
                type="button"
                onClick={() => triggerShatter('portfolio')}
                className="absolute pointer-events-auto cursor-pointer flex items-center justify-center font-semibold opacity-0 hover:opacity-100 bg-[#36d67e] text-[#031109] transition-opacity duration-150"
                style={{
                  left: leftX,
                  top: ctaY,
                  width: pillW,
                  height: pillH,
                  borderRadius: Math.max(4, 6 * S),
                  fontSize: Math.max(12.5, 15.5 * S),
                }}
              >
                {PORTFOLIO_IDENTITY.primaryCta}
              </button>

              {/* Interactive "Read paper →" Link */}
              <button
                type="button"
                onClick={() => triggerShatter('about')}
                className="absolute pointer-events-auto cursor-pointer font-semibold text-transparent hover:text-[#36d67e] border-b border-transparent hover:border-[#36d67e] transition-colors flex items-center"
                style={{
                  left: leftX + pillW + Math.max(18, 28 * S),
                  top: ctaY,
                  height: pillH,
                  fontSize: Math.max(12.5, 15.5 * S),
                }}
              >
                {PORTFOLIO_IDENTITY.secondaryCta}
              </button>

              {/* Footer Links */}
              <div
                className="absolute select-text pointer-events-auto text-transparent"
                style={{
                  left: leftX,
                  bottom: bottomPad,
                  fontSize: Math.max(9, 11 * S),
                }}
              >
                {PORTFOLIO_IDENTITY.footerLeft}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED 4 PAGES (About, Services, Portfolio, Contact) + Persistent Top Banner */}
      <div
        ref={pageScrollRef}
        className={`fixed inset-0 z-20 overflow-y-auto transition-opacity ${
          showDefinitions
            ? 'opacity-100 pointer-events-auto duration-350'
            : 'opacity-0 pointer-events-none duration-200'
        }`}
      >
        <div className="min-h-full flex flex-col px-4 sm:px-8 pt-6 pb-16">
          {/* Persistent Smoked-Glass Top Navigation Banner (Only Home, About, Services, Portfolio, Contact) */}
          <header className="sticky top-4 z-30 mx-auto w-full max-w-5xl mb-8">
            <nav
              aria-label="Primary navigation"
              className="rounded-2xl border border-[#1f3b2c] bg-[#07110c]/95 px-4 sm:px-8 py-3.5 shadow-[0_18px_45px_rgba(0,0,0,0.55)] flex items-center justify-center"
            >
              <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-10 text-sm sm:text-base font-semibold">
                {BANNER_NAV_ITEMS.map((item) => {
                  const isActive = item.id !== 'home' && activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        item.id === 'home' ? triggerBack() : navigatePage(item.id)
                      }
                      className={`relative cursor-pointer px-2 py-1 transition-colors ${
                        isActive
                          ? 'text-[#52e896]'
                          : 'text-white/85 hover:text-[#52e896]'
                      }`}
                    >
                      {item.label}
                      {isActive && (
                        <span className="absolute left-1/2 -bottom-0.5 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#36d67e]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </header>

          {/* Sequential Next-to-Next Pages (About -> Services -> Portfolio -> Contact) with Outward Glass Reflections */}
          {showDefinitions && (
            <main className="flex-1 w-full select-text space-y-20 sm:space-y-24 pb-12">
              <Suspense fallback={<p role="status" className="mx-auto max-w-5xl py-12 text-center text-white/75">Loading portfolio content...</p>}>
              <GlassReflectionPage
                id="about"
                index={0}
                label="About"
                sectionRef={(el) => {
                  sectionRefs.current.about = el;
                }}
              >
                <AboutPage
                  onNavigate={navigatePage}
                />
              </GlassReflectionPage>

              <GlassReflectionPage
                id="services"
                index={1}
                label="Services"
                sectionRef={(el) => {
                  sectionRefs.current.services = el;
                }}
              >
                <ServicesPage />
              </GlassReflectionPage>

              <GlassReflectionPage
                id="portfolio"
                index={2}
                label="Portfolio"
                sectionRef={(el) => {
                  sectionRefs.current.portfolio = el;
                }}
              >
                <PortfolioPage onNavigate={navigatePage} />
              </GlassReflectionPage>

              <GlassReflectionPage
                id="contact"
                index={3}
                label="Contact"
                sectionRef={(el) => {
                  sectionRefs.current.contact = el;
                }}
              >
                <ContactPage />
              </GlassReflectionPage>
              </Suspense>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
