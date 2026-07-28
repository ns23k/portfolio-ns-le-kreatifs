/* ============================================
   DATA — loaded from /data/works.json and /data/sport.json
   (these files are edited through /admin — see README)
============================================ */
let works = [];
let sportWorks = [];

/* ============================================
   THEME TOGGLE (light / dark)
============================================ */
const root = document.documentElement;
const themeBtn = document.getElementById('themeToggle');
const applyTheme = (t) => {
  if(t === 'dark'){ root.classList.add('dark'); themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>'; }
  else { root.classList.remove('dark'); themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>'; }
};
const saved = localStorage.getItem('nk-theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(saved);
themeBtn.addEventListener('click', () => {
  const next = root.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('nk-theme', next);
});

/* ============================================
   MOBILE DRAWER
============================================ */
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
document.getElementById('burgerBtn').addEventListener('click', () => { drawer.classList.add('open'); overlay.classList.add('show'); });
const closeDrawer = () => { drawer.classList.remove('open'); overlay.classList.remove('show'); };
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);
drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

/* ============================================
   LIGHTBOX (shared by both galleries)
============================================ */
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lightboxImg');
const lbTitle = document.getElementById('lightboxTitle');
const lbCat = document.getElementById('lightboxCat');
function openLightbox(w){
  lbImg.src = w.src; lbImg.alt = w.title;
  lbTitle.textContent = w.title;
  lbCat.textContent = w.catLabel;
  lightbox.classList.add('open');
}
document.getElementById('lightboxClose').addEventListener('click', () => lightbox.classList.remove('open'));
lightbox.addEventListener('click', (e) => { if(e.target === lightbox) lightbox.classList.remove('open'); });
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') lightbox.classList.remove('open'); });

/* ============================================
   FORM VALIDATION + mailto submit
============================================ */
const form = document.getElementById('quoteForm');
const successBox = document.getElementById('formSuccess');

function setInvalid(field, invalid){
  field.classList.toggle('invalid', invalid);
}
form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;

  const nameF = document.getElementById('fname');
  const emailF = document.getElementById('femail');
  const phoneF = document.getElementById('fphone');
  const typeF = document.getElementById('ftype');
  const msgF = document.getElementById('fmsg');

  const nameValid = nameF.value.trim().length >= 2;
  setInvalid(nameF.closest('.field'), !nameValid); valid = valid && nameValid;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailF.value.trim());
  setInvalid(emailF.closest('.field'), !emailValid); valid = valid && emailValid;

  const phoneVal = phoneF.value.trim();
  const phoneValid = phoneVal === '' || /^[\d+\s-]{7,15}$/.test(phoneVal);
  setInvalid(phoneF.closest('.field'), !phoneValid); valid = valid && phoneValid;

  const typeValid = typeF.value !== '';
  setInvalid(typeF.closest('.field'), !typeValid); valid = valid && typeValid;

  const msgValid = msgF.value.trim().length >= 10;
  setInvalid(msgF.closest('.field'), !msgValid); valid = valid && msgValid;

  if(!valid){ successBox.classList.remove('show'); return; }

  const subject = encodeURIComponent(`Demande de devis — ${typeF.value}`);
  const body = encodeURIComponent(
    `Nom : ${nameF.value}\nEmail : ${emailF.value}\nTéléphone : ${phoneVal || 'N/A'}\nType de projet : ${typeF.value}\n\nMessage :\n${msgF.value}`
  );
  window.location.href = `mailto:etudeetudiant123@gmail.com?subject=${subject}&body=${body}`;

  successBox.classList.add('show');
  form.reset();
});

/* ============================================
   BACK TO TOP + HEADER SHADOW ON SCROLL
============================================ */
const toTop = document.getElementById('toTop');
const siteHeader = document.querySelector('header');
window.addEventListener('scroll', () => {
  toTop.classList.toggle('show', window.scrollY > 500);
  siteHeader.classList.toggle('scrolled', window.scrollY > 20);
});
toTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

document.getElementById('year').textContent = new Date().getFullYear();

/* animate skill bars once visible (doesn't depend on portfolio data) */
const aboutSection = document.getElementById('about');
const io2 = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if(en.isIntersecting){
      document.querySelectorAll('.skill-bar i').forEach(bar => { bar.style.width = bar.dataset.w + '%'; });
      io2.disconnect();
    }
  });
}, {threshold:.3});
io2.observe(aboutSection);

/* reveal-on-scroll for static elements (present regardless of fetched data) */
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => { if(en.isIntersecting) en.target.classList.add('in'); });
}, {threshold:.15});
document.querySelectorAll('.reveal, .service-card').forEach(el => io.observe(el));

/* ============================================
   LOAD PORTFOLIO DATA, THEN BUILD EVERYTHING
   THAT DEPENDS ON IT (hero slider, galleries, stat counter)
============================================ */
async function loadPortfolioData(){
  try{
    const [worksRes, sportRes] = await Promise.all([
      fetch('data/works.json'),
      fetch('data/sport.json')
    ]);
    const worksData = await worksRes.json();
    const sportData = await sportRes.json();
    works = worksData.items || [];
    sportWorks = sportData.items || [];
  }catch(err){
    console.error('Impossible de charger les données du portfolio (data/works.json, data/sport.json).', err);
    console.error('Astuce : ouvrir index.html directement (file://) bloque ce chargement. Utilise un serveur local ou ton hébergement en ligne.');
  }
  buildHeroSlider();
  buildGallery();
  buildSportGallery();
  observeGalleryReveal();
  startStatCounter();
}

/* ============================================
   HERO SLIDER
============================================ */
function buildHeroSlider(){
  const sliderEl = document.getElementById('heroSlider');
  const dotsEl = document.getElementById('sliderDots');
  const heroPicks = ["96h d'Int'Act — Teaser","Coupe Lamina Thiandoum","Mir Aat — Logo","Poissonnerie d'Al Mourchid — Carte de visite","Cultur'Ailes — Lancement officiel","Tournoi du Capitaine — Finale"];
  let sliderImgs = heroPicks.map(t => works.find(w => w.title === t)).filter(Boolean);
  if(sliderImgs.length === 0) sliderImgs = works.slice(0, 6);
  let current = 0;

  sliderImgs.forEach((w, i) => {
    const s = document.createElement('div');
    s.className = 'slide' + (i === 0 ? ' active' : '');
    s.innerHTML = `<img src="${w.src}" alt="${w.title}"><div class="slide-caption">${w.title}</div>`;
    sliderEl.appendChild(s);
    const d = document.createElement('button');
    if(i === 0) d.classList.add('active');
    d.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(d);
  });
  const slides = sliderEl.querySelectorAll('.slide');
  const dots = dotsEl.querySelectorAll('button');
  if(slides.length === 0) return;

  function goTo(i){
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }
  document.getElementById('sliderNext').addEventListener('click', () => goTo(current + 1));
  document.getElementById('sliderPrev').addEventListener('click', () => goTo(current - 1));
  let autoSlide = setInterval(() => goTo(current + 1), 4200);
  document.querySelector('.stage').addEventListener('mouseenter', () => clearInterval(autoSlide));
  document.querySelector('.stage').addEventListener('mouseleave', () => { autoSlide = setInterval(() => goTo(current + 1), 4200); });
}

/* ============================================
   GALLERY + FILTER
============================================ */
const galleryEl = document.getElementById('gallery');
function renderGallery(filter){
  galleryEl.innerHTML = '';
  const list = filter === 'all' ? works : works.filter(w => w.cat === filter);
  list.forEach((w, i) => {
    const item = document.createElement('div');
    item.className = 'g-item';
    item.style.animationDelay = (i * 0.06) + 's';
    item.innerHTML = `
      <div class="thumb"><img src="${w.src}" alt="${w.title}" loading="lazy"></div>
      <div class="g-zoom"><i class="fa-solid fa-expand"></i></div>
      <div class="g-caption"><span class="cat">${w.catLabel}</span><h4>${w.title}</h4></div>
    `;
    item.addEventListener('click', () => openLightbox(w));
    galleryEl.appendChild(item);
  });
}
function buildGallery(){
  renderGallery('all');
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGallery(btn.dataset.filter);
      observeGalleryReveal();
    });
  });
}

/* ============================================
   SPORT DESIGN GALLERY
============================================ */
function buildSportGallery(){
  const sportGalleryEl = document.getElementById('sportGallery');
  if(!sportGalleryEl) return;
  sportWorks.forEach((w, i) => {
    const item = document.createElement('div');
    item.className = 'g-item';
    item.style.animationDelay = (i * 0.06) + 's';
    item.innerHTML = `
      <div class="thumb"><img src="${w.src}" alt="${w.title}" loading="lazy"></div>
      <div class="g-zoom"><i class="fa-solid fa-expand"></i></div>
      <div class="g-caption"><span class="cat">${w.catLabel}</span><h4>${w.title}</h4></div>
    `;
    item.addEventListener('click', () => openLightbox(w));
    sportGalleryEl.appendChild(item);
  });
}

/* re-observe .g-item elements each time the gallery is (re)rendered */
function observeGalleryReveal(){
  document.querySelectorAll('.g-item').forEach(el => io.observe(el));
}

/* stat counter — now driven by works.length once data has loaded */
function startStatCounter(){
  const statEl = document.getElementById('statProjects');
  let counted = false;
  const io3 = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(en.isIntersecting && !counted){
        counted = true;
        let n = 0; const target = works.length;
        const step = setInterval(() => {
          n++; statEl.textContent = n;
          if(n >= target) clearInterval(step);
        }, 90);
        io3.disconnect();
      }
    });
  }, {threshold:.5});
  io3.observe(document.querySelector('.hero-stats'));
}

loadPortfolioData();
