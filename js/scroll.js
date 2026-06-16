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
    const heroTitle = heroContent.querySelector('h1');
    const heroSubtitle = heroContent.querySelector('.subtitle');
    const heroGreeting = heroContent.querySelector('.greeting');

    if (heroGreeting) {
      gsap.fromTo(heroGreeting,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out', delay: 0.1 }
      );
    }

    if (heroTitle) {
      gsap.fromTo(heroTitle,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out', delay: 0.25 }
      );
    }

    if (heroSubtitle) {
      gsap.fromTo(heroSubtitle,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out', delay: 0.4 }
      );
    }

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

  const sections = document.querySelectorAll('.section:not(#hero)');
  sections.forEach((section) => {
    const content = section.querySelector('.section-content');
    if (!content) return;

    const h2 = content.querySelector('h2');
    if (h2) {
      gsap.fromTo(h2,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    const desc = content.querySelector('.section-desc');
    if (desc) {
      gsap.fromTo(desc,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          delay: 0.15,
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    const cards = content.querySelectorAll('.about-card, .project-card, .cert-card');
    if (cards.length > 0) {
      gsap.fromTo(cards,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  });

  return {
    getProgress: () => scrollProgress,
  };
}
