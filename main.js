// Intersection Observer for scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.animate-up, .animate-fade, .animate-left, .animate-right')
  .forEach(el => observer.observe(el));

// ===== SLIDER + LIGHTBOX =====
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

  // collect slide data
  const slideData = Array.from(slides).map(s => ({
    src: s.querySelector('img').src,
    alt: s.querySelector('img').alt,
    caption: s.querySelector('.slider__caption') ? s.querySelector('.slider__caption').textContent : ''
  }));

  // create dots
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

  // touch swipe on slider
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(current + (diff > 0 ? 1 : -1)); resetAuto(); }
  });

  // click slide → open lightbox
  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => openLightbox(i));
  });

  startAuto();

  // ===== LIGHTBOX =====
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

  // keyboard navigation
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') { lbCurrent = (lbCurrent - 1 + slideData.length) % slideData.length; updateLightbox(); }
    if (e.key === 'ArrowRight') { lbCurrent = (lbCurrent + 1) % slideData.length; updateLightbox(); }
  });

  // touch swipe on lightbox
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

// Mobile burger menu
const burger = document.getElementById('burger');
const navList = document.getElementById('navList');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNavPopup = document.getElementById('mobileNavPopup');
const mobileBar = document.querySelector('.mobile-bar');

function toggleMenu() {
  if (mobileNavPopup) mobileNavPopup.classList.toggle('open');
  if (mobileMenuBtn) mobileMenuBtn.classList.toggle('open');
}

if (burger && navList) burger.addEventListener('click', () => navList.classList.toggle('open'));
if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });

// close popup on outside click
document.addEventListener('click', (e) => {
  if (mobileNavPopup && mobileNavPopup.classList.contains('open')) {
    if (!mobileNavPopup.contains(e.target) && e.target !== mobileMenuBtn) {
      mobileNavPopup.classList.remove('open');
      if (mobileMenuBtn) mobileMenuBtn.classList.remove('open');
    }
  }
});

// highlight active link in popup
const current = window.location.pathname.split('/').pop() || 'index.html';
if (mobileNavPopup) {
  mobileNavPopup.querySelectorAll('a').forEach(a => {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });
}

// hide bar on scroll up, show on scroll down
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (!mobileBar) return;
  if (scrollY < 50) {
    mobileBar.classList.remove('hidden');
  } else if (scrollY < lastScroll) {
    // scrolling up — hide
    mobileBar.classList.add('hidden');
    if (mobileNavPopup) mobileNavPopup.classList.remove('open');
    if (mobileMenuBtn) mobileMenuBtn.classList.remove('open');
  } else {
    // scrolling down — show
    mobileBar.classList.remove('hidden');
  }
  lastScroll = scrollY;
}, { passive: true });

// Active nav link
const links = document.querySelectorAll('.nav__link');
const current = window.location.pathname.split('/').pop() || 'index.html';
links.forEach(link => {
  const href = link.getAttribute('href');
  if (href === current) link.classList.add('active');
  else link.classList.remove('active');
});
