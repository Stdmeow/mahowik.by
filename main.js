
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.animate-up, .animate-fade, .animate-left, .animate-right')
  .forEach(el => observer.observe(el));


const track = document.getElementById('sliderTrack');
const prevBtn = document.getElementById('sliderPrev');
const nextBtn = document.getElementById('sliderNext');
const dotsContainer = document.getElementById('sliderDots');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

if (track) {
  const slides = track.querySelectorAll('.slider__slide');
  let current = 0;
  let autoTimer;

  
  const slideData = Array.from(slides).map(s => ({
    src: s.querySelector('img').src,
    alt: s.querySelector('img').alt,
    caption: s.querySelector('.slider__caption') ? s.querySelector('.slider__caption').textContent : ''
  }));

  
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider__dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Слайд ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsContainer.querySelectorAll('.slider__dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function startAuto() { autoTimer = setInterval(() => goTo(current + 1), 4000); }
  function resetAuto() { clearInterval(autoTimer); startAuto(); }

  prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(current + (diff > 0 ? 1 : -1)); resetAuto(); }
  });

  
  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => openLightbox(i));
  });

  startAuto();

  
  let lbCurrent = 0;

  function openLightbox(index) {
    lbCurrent = index;
    updateLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateLightbox() {
    const d = slideData[lbCurrent];
    lightboxImg.src = d.src;
    lightboxImg.alt = d.alt;
    lightboxCaption.textContent = d.caption;
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  lightboxPrev.addEventListener('click', () => {
    lbCurrent = (lbCurrent - 1 + slideData.length) % slideData.length;
    updateLightbox();
  });
  lightboxNext.addEventListener('click', () => {
    lbCurrent = (lbCurrent + 1) % slideData.length;
    updateLightbox();
  });

  
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') { lbCurrent = (lbCurrent - 1 + slideData.length) % slideData.length; updateLightbox(); }
    if (e.key === 'ArrowRight') { lbCurrent = (lbCurrent + 1) % slideData.length; updateLightbox(); }
  });

  
  let lbTouchX = 0;
  lightbox.addEventListener('touchstart', e => { lbTouchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const diff = lbTouchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      lbCurrent = (lbCurrent + (diff > 0 ? 1 : -1) + slideData.length) % slideData.length;
      updateLightbox();
    }
  });
}


const burger = document.getElementById('burger');
const navList = document.getElementById('navList');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNavPopup = document.getElementById('mobileNavPopup');
const mobileBar = document.querySelector('.mobile-bar');

function toggleMenu() {
  if (mobileNavPopup) mobileNavPopup.classList.toggle('open');
  if (mobileMenuBtn) mobileMenuBtn.classList.toggle('open');
}

if (burger && navList) burger.addEventListener('click', () => {
  navList.classList.toggle('open');
  burger.classList.toggle('open');
});
if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });


document.addEventListener('click', (e) => {
  if (mobileNavPopup && mobileNavPopup.classList.contains('open')) {
    if (!mobileNavPopup.contains(e.target) && e.target !== mobileMenuBtn) {
      mobileNavPopup.classList.remove('open');
      if (mobileMenuBtn) mobileMenuBtn.classList.remove('open');
    }
  }
});


const currentPage = window.location.pathname.split('/').pop() || 'index.html';
if (mobileNavPopup) {
  mobileNavPopup.querySelectorAll('a').forEach(a => {
    if (a.getAttribute('href') === currentPage) a.classList.add('active');
  });
}


let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (!mobileBar) return;

  if (header) {
    const headerBottom = header.getBoundingClientRect().bottom;
    if (headerBottom > 0) {
      mobileBar.classList.remove('visible');
      if (mobileNavPopup) mobileNavPopup.classList.remove('open');
      if (mobileMenuBtn) mobileMenuBtn.classList.remove('open');
    } else {
      mobileBar.classList.add('visible');
    }
  }

  lastScroll = scrollY;
}, { passive: true });


document.querySelectorAll('.nav__link').forEach(link => {
  if (link.getAttribute('href') === currentPage) link.classList.add('active');
  else link.classList.remove('active');
});


const progressBar = document.getElementById('progressBar');
if (progressBar) {
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
    progressBar.style.width = pct + '%';
  }, { passive: true });
}


const pageTransition = document.getElementById('pageTransition');
if (pageTransition) {
  
  pageTransition.classList.add('slide-out');
  pageTransition.addEventListener('animationend', () => {
    pageTransition.style.display = 'none';
  }, { once: true });

  
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('tel:') ||
        href.startsWith('http') || href.startsWith('viber') ||
        href.startsWith('mailto')) return;
    link.addEventListener('click', e => {
      e.preventDefault();
      pageTransition.style.display = 'block';
      pageTransition.classList.remove('slide-out');
      pageTransition.classList.add('slide-in');
      pageTransition.addEventListener('animationend', () => {
        window.location.href = href;
      }, { once: true });
    });
  });
}


const heroBg = document.querySelector('.hero__bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    heroBg.style.transform = `translateY(${y * 0.35}px)`;
  }, { passive: true });
}


const heroTitle = document.getElementById('heroTitle');
if (heroTitle) {
  const lines = ['Ремонт маховиков', 'в Беларуси'];
  const colors = [null, 'var(--yellow)'];
  let html = '';
  let charIndex = 0;
  let lineIndex = 0;
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  heroTitle.appendChild(cursor);

  function typeNext() {
    if (lineIndex >= lines.length) { return; }
    const line = lines[lineIndex];
    if (charIndex < line.length) {
      if (charIndex === 0) {
        html += colors[lineIndex]
          ? `<span style="color:${colors[lineIndex]}">`
          : '';
      }
      html += line[charIndex];
      charIndex++;
      const closeTag = colors[lineIndex] && charIndex === line.length ? '</span>' : '';
      heroTitle.innerHTML = html + closeTag + '<span class="typing-cursor"></span>';
      setTimeout(typeNext, 55);
    } else {
      if (colors[lineIndex]) html += '</span>';
      lineIndex++;
      charIndex = 0;
      if (lineIndex < lines.length) {
        html += '<br>';
        setTimeout(typeNext, 180);
      }
    }
  }
  setTimeout(typeNext, 600);
}


function animateCounter(el, target, duration) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 4);
    const val = Math.round(ease * target);
    el.textContent = val.toLocaleString('ru');
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString('ru');
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const raw = el.dataset.count;
    if (!raw) return;
    animateCounter(el, parseInt(raw), 1500);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));


const canvas = document.getElementById('particles-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W, H;

  function resize() {
    const hero = canvas.parentElement;
    W = canvas.width = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 55; i++) {
    particles.push({
      x: Math.random() * 1000,
      y: Math.random() * 600,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      o: Math.random() * 0.5 + 0.15
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,168,0,${p.o})`;
      ctx.fill();
    });
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(245,168,0,${0.12 * (1 - dist/120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(drawParticles);
  }
  drawParticles();
}

const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) backToTop.classList.add('visible');
    else backToTop.classList.remove('visible');
  }, { passive: true });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.querySelectorAll('img[loading="lazy"]').forEach(img => {
  if (img.complete) {
    img.classList.add('loaded');
  } else {
    img.addEventListener('load', () => img.classList.add('loaded'));
  }
});

const reviewsTrack = document.getElementById('reviewsTrack');
const reviewsDots = document.getElementById('reviewsDots');
const reviewsPrev = document.getElementById('reviewsPrev');
const reviewsNext = document.getElementById('reviewsNext');

if (reviewsTrack) {
  const cards = reviewsTrack.querySelectorAll('.review-card');
  let rCurrent = 0;

  function getVisible() {
    if (window.innerWidth < 600) return 1;
    if (window.innerWidth < 900) return 2;
    return 3;
  }

  function totalSlides() {
    return Math.ceil(cards.length / getVisible());
  }

  function buildDots() {
    reviewsDots.innerHTML = '';
    for (let i = 0; i < totalSlides(); i++) {
      const d = document.createElement('button');
      d.className = 'reviews__dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => goReview(i));
      reviewsDots.appendChild(d);
    }
  }

  function goReview(index) {
    rCurrent = (index + totalSlides()) % totalSlides();
    const visible = getVisible();
    const cardWidth = reviewsTrack.parentElement.offsetWidth;
    const gap = 24;
    const slideWidth = (cardWidth - gap * (visible - 1)) / visible + gap;
    reviewsTrack.style.transform = `translateX(-${rCurrent * visible * slideWidth}px)`;
    reviewsDots.querySelectorAll('.reviews__dot').forEach((d, i) => {
      d.classList.toggle('active', i === rCurrent);
    });
  }

  buildDots();
  window.addEventListener('resize', () => { buildDots(); goReview(0); });

  reviewsPrev.addEventListener('click', () => goReview(rCurrent - 1));
  reviewsNext.addEventListener('click', () => goReview(rCurrent + 1));

  let rTouchX = 0;
  reviewsTrack.addEventListener('touchstart', e => { rTouchX = e.touches[0].clientX; }, { passive: true });
  reviewsTrack.addEventListener('touchend', e => {
    const diff = rTouchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goReview(rCurrent + (diff > 0 ? 1 : -1));
  });
}
