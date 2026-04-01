import React, { useEffect, useRef, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Box } from '@mui/material';
import HeroSection from '../components/HeroSection';
import LandingSection from '../components/LandingSection';
import Footer from '../components/Footer';
import SectionNavigation from '../components/SectionNavigation';
import AuthModal from '../modals/AuthModal';
import { useHomeScroll } from '../context/HomeScrollContext';
import { useAuth } from '../context/AuthContext';
import '../styles/scroll-snap.css';
import Seo from '../seo/Seo';
import { marketingFeatures } from '../content/marketingContent';

// CTA-Texte für die Landing Sections
const callToActionTexts = [
  'Jetzt dabei sein',
  'Jetzt umsehen',
  'Jetzt entdecken',
  'Jetzt loslegen',
  'Jetzt ausprobieren',
  'Jetzt mitmachen',
  'Kostenlos starten',
  'Jetzt anmelden',
  'Mehr erfahren',
  'Los geht’s',
];

// Fisher-Yates Shuffle Algorithmus
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const sections = marketingFeatures.map((feature) => ({
  slug: feature.slug,
  name: feature.name,
  image: feature.image,
  additionalImages: feature.additionalImages,
  text: feature.summary,
}));

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { setIsOnHeroSection } = useHomeScroll();
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 960px)');

  // Shuffle CTA-Texte einmalig beim Mount
  const [shuffledCtaTexts] = useState(() => shuffleArray(callToActionTexts));

  useEffect(() => {
    const original = document.body.style.background;
    document.body.style.background = 'none';

    return () => {
      document.body.style.background = original;
    };
  }, []);

  // Scroll-Tracking: isOnHeroSection für alle Viewports
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const heroSection = heroRef.current;
      if (!heroSection) return;

      const heroRect = heroSection.getBoundingClientRect();
      const isOnHero = heroRect.top >= -heroRect.height / 2 && heroRect.top <= heroRect.height / 2;
      setIsOnHeroSection(isOnHero);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [setIsOnHeroSection]);

  // Desktop: Custom Wheel-Handler für Hero → erste Sektion
  useEffect(() => {
    if (isMobile) return;
    const container = containerRef.current;
    if (!container) return;

    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      const heroSection = heroRef.current;
      if (!heroSection) return;

      const heroRect = heroSection.getBoundingClientRect();
      const isOnHero = heroRect.top >= -heroRect.height / 2 && heroRect.top <= heroRect.height / 2;

      if (isOnHero && e.deltaY > 0 && !isScrolling) {
        e.preventDefault();
        isScrolling = true;
        const firstSection = container.children[1] as HTMLElement;
        if (firstSection) {
          firstSection.scrollIntoView({ behavior: 'smooth' });
        }
        scrollTimeout = setTimeout(() => {
          isScrolling = false;
        }, 1000);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [isMobile]);

  const handleStartClick = () => {
    setAuthModalOpen(true);
  };

  const handleScrollToFirstSection = () => {
    const container = containerRef.current;
    if (!container) return;
    
    // Erste Landing Section ist das zweite Child (nach Hero)
    const firstSection = container.children[1] as HTMLElement;
    if (firstSection) {
      firstSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Seo
        title="Kaderblick - Vereinssoftware fuer Fussballvereine, Trainer und Teams"
        description="Digitale Vereinssoftware fuer Fussballvereine mit Kalender, Spielanalyse, Formationen, Kommunikation, News, Berichten und Vereinsorganisation in einer Plattform."
        canonicalPath="/"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Kaderblick',
            url: 'https://kaderblick.de/',
            logo: 'https://kaderblick.de/images/icon-512.png',
            contactPoint: [
              {
                '@type': 'ContactPoint',
                contactType: 'customer support',
                email: 'andreas.kempe@kaderblick.de',
                availableLanguage: ['de'],
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Kaderblick',
            url: 'https://kaderblick.de/',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Kaderblick',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'EUR',
            },
            description: 'Vereinssoftware fuer Fussballvereine mit Kalender, Trainingsorganisation, Spielanalyse, Kommunikation und Berichten.',
            url: 'https://kaderblick.de/',
          },
        ]}
      />
      <Box 
        ref={containerRef}
        className="scroll-snap-container"
      >
        <HeroSection 
          onStartClick={handleStartClick} 
          heroRef={heroRef}
          onScrollDown={handleScrollToFirstSection}
        />
        
        {sections.map((section, index) => {
          const isLastSection = index === sections.length - 1;
          return (
            <Box
              key={index}
              sx={{
                height: '100dvh',
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#4e4e4e',
              }}
            >
              <LandingSection
                name={section.name}
                image={section.image}
                additionalImages={section.additionalImages}
                text={section.text}
                reverse={index % 2 === 1}
                learnMoreHref={`/funktionen/${section.slug}`}
                onAuthClick={!user ? () => setAuthModalOpen(true) : undefined}
                ctaText={shuffledCtaTexts[index % shuffledCtaTexts.length]}
              />
            </Box>
          );
        })}
        <Box sx={{ backgroundColor: '#4e4e4e', scrollSnapAlign: 'end', pb: { xs: user ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : 0, md: 0 } }}>
          <Footer />
        </Box>
      </Box>
      
      <SectionNavigation sections={sections} containerRef={containerRef} />
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
