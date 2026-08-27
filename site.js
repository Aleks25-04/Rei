
/* ================= DATA ================= */
const SITE_DATA = JSON.parse(document.getElementById('site-data').textContent);
const galleryData = SITE_DATA.galleryData;
let galleryCats = Object.keys(galleryData);
const bgImages = SITE_DATA.bgImages;
const bgPositions = SITE_DATA.bgPositions;
const woodWords = SITE_DATA.woodWords;
/* ================= LANG ================= */
let currentLang = 'al';
function setLang(lang){
  currentLang = lang;
  document.querySelectorAll(".lang").forEach(el=>el.classList.remove("active"));
  document.querySelectorAll('.lang[data-lang="'+lang+'"]').forEach(el=>el.classList.add("active"));
  document.getElementById("btn-al").classList.toggle("active",lang==="al");
  document.getElementById("btn-en").classList.toggle("active",lang==="en");
  document.documentElement.lang = lang==="al" ? "sq":"en";
  if(typeof buildMenuGallerySub === 'function') buildMenuGallerySub();
  const overlay=document.getElementById('galleryOverlay');
  if(overlay.classList.contains('open')){
    const titleEl=document.getElementById('galleryTitle');
    const cat=titleEl.dataset.cat;
    if(cat && galleryData[cat]) titleEl.textContent = galleryData[cat].titles[lang] || galleryData[cat].titles.al;
    buildChips(cat);
  }
  buildMarquee();
  buildTiles();
}

/* ================= MARQUEE ================= */
function buildMarquee(){
  const words = woodWords[currentLang];
  const track = document.getElementById('marqueeTrack');
  const band = document.querySelector('.marquee-band');
  if(!words || !words.length){ track.innerHTML = ''; return; }
  const seq = words.map(w=>`<span>${w}</span>`).join('');
  const containerWidth = band ? band.clientWidth : window.innerWidth;
  const singleWidth = Math.max(track.scrollWidth || 1, 1);
  let copies = Math.max(12, Math.ceil((containerWidth * 3) / Math.max(singleWidth, 1)));
  if(copies % 2 !== 0) copies += 1;
  copies = Math.min(60, copies);
  track.innerHTML = seq.repeat(copies);
}
let marqueeResizeTimer = null;
window.addEventListener('resize', ()=>{
  clearTimeout(marqueeResizeTimer);
  marqueeResizeTimer = setTimeout(buildMarquee, 200);
});

/* ================= TOP BAR + MENU ================= */
const topbar = document.getElementById('topbar');
let scrollTicking = false;
function onScrollUpdate(){
  topbar.classList.toggle('scrolled', window.scrollY > 40);
  const h = document.documentElement.scrollHeight - window.innerHeight;
  document.getElementById('scrollProgress').style.width = (h>0 ? (window.scrollY/h*100) : 0) + '%';
  document.getElementById('fabTop').classList.toggle('show', window.scrollY > 500);
  scrollTicking = false;
}
window.addEventListener('scroll', ()=>{
  if(!scrollTicking){
    requestAnimationFrame(onScrollUpdate);
    scrollTicking = true;
  }
}, {passive:true});

const menuBtn = document.getElementById('menuBtn');
const menuPanel = document.getElementById('menuPanel');
function toggleMenu(force){
  const open = force!==undefined ? force : !menuPanel.classList.contains('open');
  menuPanel.classList.toggle('open', open);
  menuBtn.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
menuBtn.addEventListener('click', ()=>toggleMenu());
menuPanel.querySelectorAll('a[data-close]').forEach(a=>a.addEventListener('click', ()=>toggleMenu(false)));
function toggleMenuSub(){ document.getElementById('menuGallerySub').classList.toggle('open'); }

/* nav active-link highlighting */
const sections = ['sherbimet','galeria','procesi','kontakt'].map(id=>document.getElementById(id)).filter(Boolean);
const navAnchors = Array.from(document.querySelectorAll('.nav-links a'));
const navObserver = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      navAnchors.forEach(a=>a.classList.toggle('active-link', a.getAttribute('href')==='#'+e.target.id));
    }
  });
},{rootMargin:'-45% 0px -50% 0px'});
sections.forEach(s=>navObserver.observe(s));

/* ================= HERO SLIDESHOW ================= */
const hero = document.getElementById('top');
const slides = bgImages.map((src,i)=>{
  const div = document.createElement('div');
  div.className = 'hero-slide';
  div.style.backgroundImage = `url(${src})`;
  div.style.backgroundPosition = bgPositions[i] || 'center';
  hero.insertBefore(div, hero.firstChild);
  return div;
});
let currentSlide = 0;
if(slides.length){
  slides[0].classList.add('active');
  setInterval(()=>{
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide+1) % slides.length;
    slides[currentSlide].classList.add('active');
  }, 6000);
}

/* ================= GALLERY TILES (home preview) ================= */
function firstPhoto(cat){ return galleryData[cat].photos[0] || null; }

/* Belt-and-suspenders: the blur-up placeholder should clear the instant the
   full image's onload fires, but if that event is ever missed (slow devices,
   embedded preview frames, odd caching behavior) this guarantees it clears
   anyway after a short delay instead of staying blurry forever. */
function revealImagesSoon(container){
  if(!container) return;
  container.querySelectorAll('.img-main').forEach(img=>{
    const markLoaded = ()=>{
      img.classList.add('loaded');
      const shimmer = img.parentElement && img.parentElement.querySelector('.img-shimmer');
      if(shimmer) shimmer.classList.add('done');
    };
    if(img.complete && img.naturalWidth > 0) markLoaded();
    setTimeout(markLoaded, 1200);
  });
}
function buildTiles(){
  const grid = document.getElementById('tileGrid');
  grid.innerHTML = '';
  galleryCats.forEach(cat=>{
    const data = galleryData[cat];
    const photo = firstPhoto(cat);
    const tile = document.createElement('div');
    tile.className = 'tile' + (photo ? '' : ' tile-empty');
    tile.onclick = ()=>openGallery(cat);
    if(photo){
      const ph = (data.placeholders && data.placeholders[0]) || '';
      tile.innerHTML = `${ph ? `<img class="img-ph" src="${ph}" alt="" aria-hidden="true"/>` : ''}
        <img class="img-main" src="${photo}" alt="${data.titles.al}" decoding="async" onload="this.classList.add('loaded')"/>
        <div class="tile-content">
          <div class="tile-title">${data.titles[currentLang]}</div>
          <div class="tile-tag">${data.photos.length} <span class="lang active" data-lang="al">foto</span><span class="lang" data-lang="en">photos</span></div>
        </div>`;
    } else {
      tile.innerHTML = `<div class="tile-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="9" r="1.4"/><path d="M21 15l-5-5L5 21"/></svg></div>
        <div class="tile-content">
          <div class="tile-title">${data.titles[currentLang]}</div>
          <div class="tile-tag"><span class="lang active" data-lang="al">Së shpejti</span><span class="lang" data-lang="en">Coming soon</span></div>
        </div>`;
    }
    grid.appendChild(tile);
  });
  document.querySelectorAll(".lang").forEach(el=>el.classList.remove("active"));
  document.querySelectorAll('.lang[data-lang="'+currentLang+'"]').forEach(el=>el.classList.add("active"));
  revealImagesSoon(grid);
}

/* ================= GALLERY OVERLAY ================= */
let currentPhotos = [], currentLightboxIndex = 0, currentCatIndex = 0;

function buildChips(activeCat){
  const row = document.getElementById('chipRow');
  row.innerHTML = '';
  galleryCats.forEach(cat=>{
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat===activeCat ? ' active' : '');
    chip.textContent = galleryData[cat].titles[currentLang];
    chip.onclick = ()=>openGallery(cat);
    row.appendChild(chip);
  });
}

function openGallery(cat){
  toggleMenu(false);
  const data = galleryData[cat];
  currentPhotos = data.photos;
  currentCatIndex = galleryCats.indexOf(cat);
  const titleEl = document.getElementById('galleryTitle');
  titleEl.textContent = data.titles[currentLang] || data.titles.al;
  titleEl.dataset.cat = cat;
  buildChips(cat);
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  if(!data.photos.length){
    grid.innerHTML = `<div class="gallery-empty">
      <div class="gallery-empty-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="9" r="1.4"/><path d="M21 15l-5-5L5 21"/></svg></div>
      <div class="gallery-empty-text"><span class="lang active" data-lang="al">Fotot do të shtohen së shpejti.</span><span class="lang" data-lang="en">Photos will be added soon.</span></div>
    </div>`;
    document.querySelectorAll(".lang").forEach(el=>el.classList.remove("active"));
    document.querySelectorAll('.lang[data-lang="'+currentLang+'"]').forEach(el=>el.classList.add("active"));
  } else {
    data.photos.forEach((src,i)=>{
      const ph = (data.placeholders && data.placeholders[i]) || '';
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `${ph ? `<img class="img-ph" src="${ph}" alt="" aria-hidden="true"/>` : ''}
        <div class="img-shimmer"></div>
        <img class="img-main" src="${src}" alt="${data.titles.al} ${i+1}" decoding="async"
             onload="this.classList.add('loaded');this.parentElement.querySelector('.img-shimmer').classList.add('done');"/>`;
      item.addEventListener('click', ()=>openLightbox(i));
      grid.appendChild(item);
      setTimeout(()=>item.classList.add('visible'), 60*i);
    });
    revealImagesSoon(grid);
  }
  document.getElementById('galleryOverlay').classList.add('open');
  document.getElementById('galleryOverlay').scrollTop = 0;
  document.body.style.overflow = 'hidden';
}
function closeGallery(){
  document.getElementById('galleryOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
function openGalleryMenuFirst(){
  const withPhotos = galleryCats.find(c=>galleryData[c].photos.length);
  openGallery(withPhotos || galleryCats[0]);
}

/* ================= LIGHTBOX ================= */
function updateCounter(){
  document.getElementById('lightboxCounter').textContent = (currentLightboxIndex+1)+' / '+currentPhotos.length;
}
function openLightbox(i){
  currentLightboxIndex = i;
  const img = document.getElementById('lightboxImg');
  img.style.opacity = '0';
  img.src = currentPhotos[i];
  img.onload = ()=>{ img.style.opacity = '1'; };
  updateCounter();
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox(){ document.getElementById('lightbox').classList.remove('open'); }
function lightboxNav(dir){
  currentLightboxIndex = (currentLightboxIndex+dir+currentPhotos.length) % currentPhotos.length;
  const img = document.getElementById('lightboxImg');
  img.style.opacity = '0';
  setTimeout(()=>{ img.src = currentPhotos[currentLightboxIndex]; img.style.opacity='1'; updateCounter(); }, 150);
}
(function(){
  let touchStartX=0, touchStartY=0;
  const lb = document.getElementById('lightbox');
  lb.addEventListener('touchstart', e=>{ touchStartX=e.touches[0].clientX; touchStartY=e.touches[0].clientY; }, {passive:true});
  lb.addEventListener('touchend', e=>{
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40){ dx<0 ? lightboxNav(1) : lightboxNav(-1); }
  }, {passive:true});
  lb.addEventListener('click', e=>{ if(e.target===lb) closeLightbox(); });
})();
document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){ closeLightbox(); closeGallery(); toggleMenu(false); }
  if(document.getElementById('lightbox').classList.contains('open')){
    if(e.key==='ArrowLeft') lightboxNav(-1);
    if(e.key==='ArrowRight') lightboxNav(1);
  }
});

/* ================= REVEAL ON SCROLL ================= */
const observer = new IntersectionObserver((entries)=>{
  entries.forEach((e,i)=>{
    if(e.isIntersecting){ setTimeout(()=>e.target.classList.add('visible'), i*70); observer.unobserve(e.target); }
  });
},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));


/* ================= INIT ================= */
document.getElementById('year').textContent = new Date().getFullYear();
buildMarquee();
buildTiles();
setLang('al');

/* ================= ADMIN MODE (MySQL-ready, no Firebase) ================= */

/*
   MySQL setup:
   - Keep the site in local mode by default.
   - When your PHP/Node backend is ready, set MYSQL_API_ENABLED = true and
     point MYSQL_API_BASE to your API URL such as /api or https://your-domain/api.
   - The backend should return/store the same JSON structure used below.
*/
const MYSQL_API_ENABLED = true;
const MYSQL_API_BASE = '/api';

let cloudMode = false;
let db = null;
let storage = null;

if (MYSQL_API_ENABLED) {
  cloudMode = true;
}

/* Fallback credentials used for local admin mode when no backend is connected. */
const ADMIN_EMAIL = "admin@ajce.al";
const ADMIN_PASSWORD = "ajce2025";

const ADMIN_SESSION_KEY = "ajce_admin_session_v1";
const DRAFT_KEY = "ajce_admin_draft_v1";

async function apiRequest(endpoint, options = {}) {
  const url = `${MYSQL_API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function uploadPhotoToApi(file, category) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}

async function deletePhotoFromApi(path) {
  if (!path) return;
  return;
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------- Toast ---------- */
function adminToast(msg, ms){
  const wrap = document.getElementById('adminToastWrap');
  if(!wrap) return;
  const el = document.createElement('div');
  el.className = 'admin-toast';
  el.textContent = msg;
  wrap.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{
    el.classList.remove('show');
    setTimeout(()=>el.remove(), 300);
  }, ms || 2600);
}

/* ---------- Translation (Albanian -> English) via MyMemory (free, no key) ---------- */
async function translateText(text, from, to){
  const trimmed = (text||'').trim();
  if(!trimmed) return '';
  try{
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(trimmed) + '&langpair=' + from + '|' + to;
    const res = await fetch(url);
    if(!res.ok) throw new Error('network');
    const data = await res.json();
    const out = data && data.responseData && data.responseData.translatedText;
    if(!out) throw new Error('empty');
    return out;
  }catch(err){
    console.warn('translateText failed', err);
    return null;
  }
}

/* ---------- Draft persistence (best-effort; large photo libraries may exceed
   the browser's localStorage quota, in which case this silently no-ops and
   the admin should rely on "Download Updated Website" instead) ---------- */
function collectTextEdits(){
  const out = {};
  document.querySelectorAll('[data-edit-key]').forEach(el=>{
    const key = el.dataset.editKey, lang = el.dataset.lang;
    if(!out[key]) out[key] = {};
    out[key][lang] = el.textContent;
  });
  return out;
}
function applyTextEdits(edits){
  if(!edits) return;
  document.querySelectorAll('[data-edit-key]').forEach(el=>{
    const key = el.dataset.editKey, lang = el.dataset.lang;
    if(edits[key] && typeof edits[key][lang] === 'string'){
      el.textContent = edits[key][lang];
    }
  });
}
let draftSaveFailed = false;
let hasUnsavedChanges = false;
let cloudSaveTimer = null;
let cloudSavePending = false;

function updateUnsavedIndicator(){
  const badge = document.getElementById('adminBadge');
  if(!badge) return;
  if(cloudMode){
    if(cloudSavePending){
      badge.textContent = 'Saving…';
      badge.classList.remove('admin-badge-warn');
    }else{
      badge.textContent = '☁ Saved';
      badge.classList.remove('admin-badge-warn');
    }
  }else if(hasUnsavedChanges){
    badge.textContent = '● Unsaved changes';
    badge.classList.add('admin-badge-warn');
  }else{
    badge.textContent = 'Edit Mode';
    badge.classList.remove('admin-badge-warn');
  }
}
function markUnsaved(){
  hasUnsavedChanges = true;
  updateUnsavedIndicator();
}

/* saveDraft() is called after every edit. In cloud mode it debounces a write
   straight to Firestore; otherwise it falls back to the original browser-local
   draft (and the person still needs to click "Download Updated Website"). */
function saveDraft(){
  if(cloudMode){
    saveToCloud();
    return;
  }
  markUnsaved();
  try{
    const payload = JSON.stringify({
      galleryData, woodWords,
      textEdits: collectTextEdits(),
      savedAt: Date.now()
    });
    localStorage.setItem(DRAFT_KEY, payload);
  }catch(err){
    if(!draftSaveFailed){
      draftSaveFailed = true;
      adminToast("Heads up: this browser can't auto-save a local draft (too much photo data). Use \"Download Updated Website\" often so you don't lose work.", 5200);
    }
  }
}

function saveToCloud(){
  if (!MYSQL_API_ENABLED) {
    saveDraft();
    return;
  }

  cloudSavePending = true;
  updateUnsavedIndicator();
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(async ()=>{
    try{
      const payload = {
        textEdits: collectTextEdits(),
        woodWords: { al: woodWords.al, en: woodWords.en },
        galleryData
      };

      await apiRequest('/site', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      cloudSavePending = false;
      updateUnsavedIndicator();
    }catch(err){
      console.error('MySQL/API save failed', err);
      cloudSavePending = false;
      updateUnsavedIndicator();
      adminToast('Could not save through the API — check your backend and try again.', 4500);
    }
  }, 700);
}

/* loadDraft() runs right after logging in, to pull the latest saved state
   into the editor (cloud mode: from Firestore; local mode: from this browser's
   draft, same as before). */
async function loadDraft(){
  if(cloudMode){
    try{
      const data = await apiRequest('/site');
      if(data){
        if(data.woodWords){
          woodWords.al = data.woodWords.al || woodWords.al;
          woodWords.en = data.woodWords.en || woodWords.en;
        }
        if(data.textEdits){
          applyTextEdits(data.textEdits);
        }
        if(data.galleryData){
          Object.keys(galleryData).forEach(k=>delete galleryData[k]);
          Object.assign(galleryData, data.galleryData);
          galleryCats = Object.keys(galleryData);
        }
      }
    }catch(err){
      console.warn('MySQL/API load failed, showing last-known content', err);
      adminToast('Could not reach the backend — showing the last-loaded version.', 4000);
    }
    return;
  }
  try{
    const raw = localStorage.getItem(DRAFT_KEY);
    if(!raw) return;
    const draft = JSON.parse(raw);
    if(draft.galleryData){
      Object.keys(galleryData).forEach(k=>delete galleryData[k]);
      Object.assign(galleryData, draft.galleryData);
    }
    if(draft.woodWords){
      woodWords.al = draft.woodWords.al || woodWords.al;
      woodWords.en = draft.woodWords.en || woodWords.en;
    }
    galleryCats = Object.keys(galleryData);
    applyTextEdits(draft.textEdits);
    hasUnsavedChanges = true;
    updateUnsavedIndicator();
  }catch(err){
    console.warn('loadDraft failed', err);
  }
}

/* Runs on every page load (not just for logged-in admins) so all visitors see
   the latest cloud content, not just whatever was baked into the file. */
async function loadPublicContentFromCloud(){
  if(!cloudMode) return;
  try{
    const data = await apiRequest('/site');
    if(data){
      if(data.woodWords){
        woodWords.al = data.woodWords.al || woodWords.al;
        woodWords.en = data.woodWords.en || woodWords.en;
      }
      if(data.textEdits){
        applyTextEdits(data.textEdits);
      }
      if(data.galleryData){
        Object.keys(galleryData).forEach(k=>delete galleryData[k]);
        Object.assign(galleryData, data.galleryData);
        galleryCats = Object.keys(galleryData);
      }
    }
    buildMenuGallerySub();
    buildMarquee();
    buildTiles();
    setLang(currentLang);
  }catch(err){
    console.warn('Public API load failed, showing the version baked into this file', err);
  }
}

/* ---------- Enter / exit edit mode ---------- */
function isLoggedIn(){
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

function enterEditMode(){
  document.body.classList.add('admin-mode');
  document.getElementById('adminToolbar').classList.remove('admin-hidden');
  updateUnsavedIndicator();
  document.querySelectorAll('[data-edit-key]').forEach(el=>{
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'false');
    if(!el.dataset.boundEdit){
      el.dataset.boundEdit = '1';
      let beforeText = el.textContent;
      el.addEventListener('focus', ()=>{ beforeText = el.textContent; });
      el.addEventListener('blur', async ()=>{
        if(el.textContent === beforeText) return;
        saveDraft();
        if(el.dataset.lang === 'al'){
          const key = el.dataset.editKey;
          const pairEn = document.querySelector('[data-edit-key="'+key+'"][data-lang="en"]');
          if(pairEn){
            el.classList.add('admin-translating');
            const translated = await translateText(el.textContent, 'sq', 'en');
            el.classList.remove('admin-translating');
            if(translated){
              pairEn.textContent = translated;
              adminToast('Translated to English — please double-check it reads naturally.');
              saveDraft();
            }else{
              adminToast('Could not auto-translate. Please edit the English text yourself.');
            }
          }
        }
      });
    }
  });
}
function exitEditMode(){
  if(!cloudMode && hasUnsavedChanges){
    const proceed = confirm('You have changes that haven\'t been downloaded yet. If you leave without clicking "Download Updated Website" and uploading it to your host, visitors won\'t see these changes. Exit anyway?');
    if(!proceed) return;
  }
  if(cloudMode && cloudSavePending){
    const proceed = confirm('A save to the cloud is still in progress. Leave anyway?');
    if(!proceed) return;
  }
  document.body.classList.remove('admin-mode');
  document.getElementById('adminToolbar').classList.add('admin-hidden');
  document.querySelectorAll('[data-edit-key]').forEach(el=>el.removeAttribute('contenteditable'));
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  adminToast('Logged out. Tap "Admin" again to make more changes.');
}

/* ---------- Login modal ---------- */
function openLogin(){
  document.getElementById('adminLoginError').classList.remove('show');
  document.getElementById('adminEmailInput').value = '';
  const pw = document.getElementById('adminPasswordInput');
  pw.value = '';
  pw.type = 'password';
  document.getElementById('adminPwEyeIcon').innerHTML = '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>';
  document.getElementById('adminLoginOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('adminEmailInput').focus(), 60);
}
function closeLogin(){ document.getElementById('adminLoginOverlay').classList.remove('open'); }

async function attemptLogin(){
  const email = document.getElementById('adminEmailInput').value.trim();
  const val = document.getElementById('adminPasswordInput').value;
  const submitBtn = document.getElementById('adminLoginSubmit');

  if(email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && val === ADMIN_PASSWORD){
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    closeLogin();
    await loadDraft();
    buildMenuGallerySub(); buildMarquee(); buildTiles();
    enterEditMode();
    adminToast('Welcome back — edit mode is on.');
  }else{
    document.getElementById('adminLoginError').classList.add('show');
  }
}

/* ---------- Gallery / photo manager ---------- */
let adminActiveCat = null;

function slugify(text){
  const map = {'ë':'e','Ë':'e','ç':'c','Ç':'c'};
  let s = text.replace(/[ëËçÇ]/g, ch=>map[ch]||ch)
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  if(!s) s = 'category';
  let unique = s, n = 1;
  while(galleryData[unique]){ unique = s + '-' + (++n); }
  return unique;
}

function renderCatTabs(){
  const tabs = document.getElementById('adminCatTabs');
  tabs.innerHTML = '';
  galleryCats.forEach(cat=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'admin-cat-tab' + (cat===adminActiveCat ? ' active' : '');
    b.textContent = galleryData[cat].titles.al || cat;
    b.onclick = ()=>selectAdminCat(cat);
    tabs.appendChild(b);
  });
}

function selectAdminCat(cat){
  adminActiveCat = cat;
  renderCatTabs();
  const d = galleryData[cat];
  document.getElementById('adminCatTitleAl').value = d.titles.al || '';
  const enField = document.getElementById('adminCatTitleEn');
  enField.value = d.titles.en || '';
  delete enField.dataset.userEdited;
  renderPhotoGrid();
}

function renderPhotoGrid(){
  const grid = document.getElementById('adminPhotoGrid');
  grid.innerHTML = '';
  if(!adminActiveCat) return;
  const d = galleryData[adminActiveCat];
  if(!d.photoPaths) d.photoPaths = [];
  d.photos.forEach((src, i)=>{
    const cell = document.createElement('div');
    cell.className = 'admin-photo-thumb';
    cell.innerHTML = `<img src="${src}" alt=""/><button type="button" aria-label="Remove photo">✕</button>`;
    cell.querySelector('button').onclick = async ()=>{
      const removedPath = d.photoPaths[i];
      d.photos.splice(i,1);
      d.placeholders.splice(i,1);
      d.photoPaths.splice(i,1);
      renderPhotoGrid();
      refreshSiteAfterGalleryChange();
      if(cloudMode && removedPath && MYSQL_API_ENABLED){
        try{ await deletePhotoFromApi(removedPath); }
        catch(err){ console.warn('Could not delete stored photo (it may already be gone):', err); }
      }
    };
    grid.appendChild(cell);
  });
  const add = document.createElement('label');
  add.className = 'admin-add-photo';
  add.innerHTML = `<span>+ Add photos</span><input type="file" accept="image/*" multiple />`;
  add.querySelector('input').onchange = (e)=>handleAddPhotos(e.target.files);
  grid.appendChild(add);
}

function makePlaceholder(dataUrl){
  return new Promise(resolve=>{
    const img = new Image();
    img.onload = ()=>{
      const w = 28, h = Math.max(1, Math.round(28 * img.height / img.width));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.5));
    };
    img.onerror = ()=>resolve(dataUrl);
    img.src = dataUrl;
  });
}

function compressUpload(dataUrl, maxDim, quality){
  return new Promise(resolve=>{
    const img = new Image();
    img.onload = ()=>{
      let w = img.width, h = img.height;
      if(Math.max(w,h) > maxDim){
        const scale = maxDim / Math.max(w,h);
        w = Math.round(w*scale); h = Math.round(h*scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = ()=>resolve(dataUrl);
    img.src = dataUrl;
  });
}

function handleAddPhotos(fileList){
  if(!adminActiveCat || !fileList || !fileList.length) return;
  const d = galleryData[adminActiveCat];
  if(!d.photoPaths) d.photoPaths = [];
  const files = Array.from(fileList);
  let remaining = files.length;
  let failures = 0;
  files.forEach(file=>{
    const reader = new FileReader();
    reader.onload = async ()=>{
      // Cap large photos down to a sensible display size so things stay fast,
      // however big the original camera photo was.
      const dataUrl = await compressUpload(reader.result, 1600, 0.85);
      const ph = await makePlaceholder(dataUrl);

      if(cloudMode){
        try{
          if (MYSQL_API_ENABLED) {
            const url = await uploadPhotoToApi(file, adminActiveCat);
            d.photos.push(url);
            d.placeholders.push(ph);
            d.photoPaths.push(url);
          } else {
            d.photos.push(dataUrl);
            d.placeholders.push(ph);
            d.photoPaths.push(null);
          }
        }catch(err){
          console.error('Photo upload via API failed', err);
          failures++;
        }
      }else{
        d.photos.push(dataUrl);
        d.placeholders.push(ph);
        d.photoPaths.push(null);
      }

      remaining--;
      if(remaining === 0){
        renderPhotoGrid();
        refreshSiteAfterGalleryChange();
        if(failures){
          adminToast(failures + ' photo(s) failed to upload — check your connection and try again.', 4500);
        }else{
          adminToast('Photo(s) added.');
        }
      }
    };
    reader.readAsDataURL(file);
  });
}

function refreshSiteAfterGalleryChange(){
  galleryCats = Object.keys(galleryData);
  buildMenuGallerySub();
  buildTiles();
  const overlay = document.getElementById('galleryOverlay');
  if(overlay.classList.contains('open')){
    const titleEl = document.getElementById('galleryTitle');
    if(titleEl.dataset.cat && galleryData[titleEl.dataset.cat]) openGallery(titleEl.dataset.cat);
  }
  saveDraft();
}

function openPhotoManager(){
  if(!adminActiveCat || !galleryData[adminActiveCat]) adminActiveCat = galleryCats[0];
  renderCatTabs();
  selectAdminCat(adminActiveCat);
  document.getElementById('adminPhotoOverlay').classList.add('open');
}
function closePhotoManager(){ document.getElementById('adminPhotoOverlay').classList.remove('open'); }

async function commitCatTitles(){
  if(!adminActiveCat) return;
  const d = galleryData[adminActiveCat];
  const alField = document.getElementById('adminCatTitleAl');
  const enField = document.getElementById('adminCatTitleEn');
  const newAl = alField.value.trim() || d.titles.al;
  const alChanged = newAl !== d.titles.al;
  d.titles.al = newAl;
  if(alChanged && !enField.dataset.userEdited){
    const t = await translateText(newAl, 'sq', 'en');
    if(t){ enField.value = t; }
  }
  d.titles.en = enField.value.trim() || d.titles.al;
  renderCatTabs();
  refreshSiteAfterGalleryChange();
}

function addCategory(){
  const al = prompt('Category name in Albanian (e.g. "Divane"):');
  if(!al || !al.trim()) return;
  const key = slugify(al.trim());
  galleryData[key] = { titles: { al: al.trim(), en: al.trim() }, photos: [], placeholders: [], photoPaths: [] };
  galleryCats = Object.keys(galleryData);
  adminActiveCat = key;
  translateText(al.trim(), 'sq', 'en').then(t=>{
    if(t){ galleryData[key].titles.en = t; if(adminActiveCat===key) document.getElementById('adminCatTitleEn').value = t; }
  });
  renderCatTabs();
  selectAdminCat(key);
  refreshSiteAfterGalleryChange();
  adminToast('Category added.');
}

function deleteCategory(){
  if(!adminActiveCat) return;
  if(galleryCats.length <= 1){ adminToast("You need at least one category."); return; }
  if(!confirm('Delete the "' + (galleryData[adminActiveCat].titles.al) + '" category and all its photos?')) return;
  const removed = galleryData[adminActiveCat];
  delete galleryData[adminActiveCat];
  galleryCats = Object.keys(galleryData);
  adminActiveCat = galleryCats[0];
  renderCatTabs();
  selectAdminCat(adminActiveCat);
  refreshSiteAfterGalleryChange();
  adminToast('Category deleted.');
  if(cloudMode && MYSQL_API_ENABLED && removed.photoPaths && removed.photoPaths.length){
    removed.photoPaths.forEach(async (path)=>{
      if(!path) return;
      try{ await deletePhotoFromApi(path); }
      catch(err){ console.warn('Could not delete stored photo:', err); }
    });
  }
}

/* ---------- Marquee / scrolling words manager ---------- */
function renderWordList(){
  const list = document.getElementById('adminWordList');
  list.innerHTML = '';
  woodWords.al.forEach((word, i)=>{
    const row = document.createElement('div');
    row.className = 'admin-word-row';
    row.innerHTML = `<input type="text" value="${escapeHtml(word)}" data-i="${i}" data-lang="al" placeholder="Albanian"/>
      <input type="text" value="${escapeHtml(woodWords.en[i]||'')}" data-i="${i}" data-lang="en" placeholder="English"/>
      <button type="button" class="admin-btn admin-btn-danger admin-btn-sm" aria-label="Remove">✕</button>`;
    const [alInput, enInput] = row.querySelectorAll('input');
    alInput.addEventListener('blur', async ()=>{
      woodWords.al[i] = alInput.value;
      if(!enInput.dataset.userEdited){
        const t = await translateText(alInput.value, 'sq', 'en');
        if(t){ woodWords.en[i] = t; enInput.value = t; }
      }
      buildMarquee(); saveDraft();
    });
    enInput.addEventListener('input', ()=>{ enInput.dataset.userEdited = '1'; });
    enInput.addEventListener('blur', ()=>{ woodWords.en[i] = enInput.value; buildMarquee(); saveDraft(); });
    row.querySelector('button').onclick = ()=>{
      woodWords.al.splice(i,1); woodWords.en.splice(i,1);
      renderWordList(); buildMarquee(); saveDraft();
    };
    list.appendChild(row);
  });
}
function addWord(){
  woodWords.al.push('Fjalë e re');
  woodWords.en.push('New word');
  renderWordList();
  buildMarquee();
  saveDraft();
}
function openWordsManager(){ renderWordList(); document.getElementById('adminWordsOverlay').classList.add('open'); }
function closeWordsManager(){ document.getElementById('adminWordsOverlay').classList.remove('open'); }

/* ---------- Menu gallery submenu (kept in sync with galleryData) ---------- */
function buildMenuGallerySub(){
  const wrap = document.getElementById('menuSubList');
  if(!wrap) return;
  wrap.innerHTML = galleryCats.map(cat=>{
    const t = galleryData[cat].titles;
    return `<a href="#" onclick="openGallery('${cat}');return false;"><span class="lang active" data-lang="al">${escapeHtml(t.al)}</span><span class="lang" data-lang="en">${escapeHtml(t.en)}</span></a>`;
  }).join('');
}

/* ---------- Save current changes ---------- */
function saveWebsiteChanges(){
  try{
    if(typeof toggleMenu === 'function') toggleMenu(false);
    if(typeof closeGallery === 'function') closeGallery();
    if(typeof closeLightbox === 'function') closeLightbox();
    const sub = document.getElementById('menuGallerySub'); if(sub) sub.classList.remove('open');
    document.body.style.overflow = '';

    if(cloudMode){
      saveToCloud();
      hasUnsavedChanges = false;
      updateUnsavedIndicator();
      adminToast('Saved to the cloud.', 2600);
      return;
    }

    saveDraft();
    hasUnsavedChanges = false;
    updateUnsavedIndicator();
    adminToast('Changes saved locally in this browser. Use a cloud backend for live site saves.', 3200);
  }catch(err){
    console.error(err);
    adminToast('Save failed — please try again.');
  }
}

/* ---------- Wire up buttons ---------- */
function initAdmin(){
  buildMenuGallerySub();
  if(cloudMode){
    document.getElementById('adminExport').textContent = 'Save to MySQL API';
  } else {
    document.getElementById('adminExport').textContent = 'Save Changes';
  }

  window.addEventListener('beforeunload', (e)=>{
    if(hasUnsavedChanges){
      e.preventDefault();
      e.returnValue = '';
    }
  });

  document.getElementById('adminLoginClose').onclick = closeLogin;
  document.getElementById('adminLoginCancel').onclick = closeLogin;
  document.getElementById('adminLoginSubmit').onclick = attemptLogin;
  document.getElementById('adminEmailInput').addEventListener('keydown', e=>{ if(e.key==='Enter'){ document.getElementById('adminPasswordInput').focus(); } });
  document.getElementById('adminPwToggle').addEventListener('click', ()=>{
    const pw = document.getElementById('adminPasswordInput');
    const btn = document.getElementById('adminPwToggle');
    const icon = document.getElementById('adminPwEyeIcon');
    const showing = pw.type === 'text';
    pw.type = showing ? 'password' : 'text';
    btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    icon.innerHTML = showing
      ? '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>'
      : '<path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.6 21.6 0 015.06-6.06M9.9 4.24A10.4 10.4 0 0112 4c7 0 11 7 11 7a21.6 21.6 0 01-2.66 3.79M14.12 14.12a3 3 0 11-4.24-4.24"/><path d="M1 1l22 22"/>';
    pw.focus();
  });
  document.getElementById('adminPasswordInput').addEventListener('keydown', e=>{ if(e.key==='Enter') attemptLogin(); });
  document.getElementById('adminLoginOverlay').addEventListener('click', e=>{ if(e.target.id==='adminLoginOverlay') closeLogin(); });

  document.getElementById('adminExit').onclick = exitEditMode;
  document.getElementById('adminOpenPhotos').onclick = openPhotoManager;
  document.getElementById('adminOpenWords').onclick = openWordsManager;
  document.getElementById('adminExport').onclick = saveWebsiteChanges;

  document.getElementById('adminPhotoClose').onclick = closePhotoManager;
  document.getElementById('adminPhotoOverlay').addEventListener('click', e=>{ if(e.target.id==='adminPhotoOverlay') closePhotoManager(); });
  document.getElementById('adminCatTitleAl').addEventListener('blur', commitCatTitles);
  const catEnField = document.getElementById('adminCatTitleEn');
  catEnField.addEventListener('input', ()=>{ catEnField.dataset.userEdited = '1'; });
  catEnField.addEventListener('blur', commitCatTitles);
  document.getElementById('adminAddCat').onclick = addCategory;
  document.getElementById('adminDeleteCat').onclick = deleteCategory;

  document.getElementById('adminWordsClose').onclick = closeWordsManager;
  document.getElementById('adminWordsOverlay').addEventListener('click', e=>{ if(e.target.id==='adminWordsOverlay') closeWordsManager(); });
  document.getElementById('adminAddWord').onclick = addWord;

  const trigger = document.getElementById('adminTrigger');
  if(trigger) trigger.addEventListener('click', async (e)=>{
    e.preventDefault();
    if(isLoggedIn()){
      await loadDraft();
      buildMenuGallerySub(); buildMarquee(); buildTiles(); setLang(currentLang);
      enterEditMode();
    }else{
      openLogin();
    }
  });

  if(cloudMode){
    loadPublicContentFromCloud();
    return;
  }

  // Local-mode fallback: if already logged in this browser session, restore edit mode straight away.
  if(isLoggedIn()){
    loadDraft();
    buildMenuGallerySub(); buildMarquee(); buildTiles();
    enterEditMode();
  }
}
initAdmin();

