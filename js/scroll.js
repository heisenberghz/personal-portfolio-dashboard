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

  return {
    getProgress: () => scrollProgress,
  };
}
