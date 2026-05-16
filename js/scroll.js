import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupScroll() {
  let scrollProgress = 0;

  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      scrollProgress = self.progress;
    },
  });

  const sections = document.querySelectorAll('.section');

  sections.forEach((section, i) => {
    const content = section.querySelector('.section-content, .hero-content');
    if (!content) return;

    gsap.fromTo(content,
      { opacity: 0, y: 100, scale: 0.88 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 72%',
          end: 'top 20%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    const cards = content.querySelectorAll('.about-card');
    cards.forEach((card, ci) => {
      gsap.fromTo(card,
        { opacity: 0, y: 60, rotateX: 25, scale: 0.85 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          duration: 1.2,
          delay: ci * 0.25,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });
  });

  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    ScrollTrigger.create({
      trigger: '.section:first-child',
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        const opacity = 1 - self.progress * 2.5;
        heroContent.style.opacity = Math.max(0, opacity);
        heroContent.style.transform = `translateY(${self.progress * 120}px) scale(${1 - self.progress * 0.15})`;
      },
    });
  }

  const navbar = document.getElementById('navbar');
  if (navbar) {
    ScrollTrigger.create({
      trigger: document.body,
      start: '80px top',
      toggleClass: { targets: navbar, className: 'scrolled' },
    });
  }

  const warpOverlay = document.createElement('div');
  warpOverlay.id = 'warp-overlay';
  warpOverlay.innerHTML = '<div class="warp-lines"></div>';
  document.body.appendChild(warpOverlay);

  sections.forEach((section, i) => {
    if (i === 0) return;

    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'top 25%',
      onEnter: () => triggerWarpEffect(),
      onEnterBack: () => triggerWarpEffect(),
    });
  });

  function triggerWarpEffect() {
    const warp = document.getElementById('warp-overlay');
    if (!warp || warp.classList.contains('active')) return;

    warp.classList.add('active');
    gsap.to(warp, {
      opacity: 1,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        gsap.to(warp, {
          opacity: 0,
          duration: 1.0,
          ease: 'power2.out',
          onComplete: () => warp.classList.remove('active'),
        });
      },
    });

    gsap.fromTo(warp.querySelector('.warp-lines'),
      { transform: 'scaleX(0)' },
      { transform: 'scaleX(4)', duration: 1.2, ease: 'power2.out' }
    );
  }

  return {
    getProgress: () => scrollProgress,
  };
}
