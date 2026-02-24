// Ecuador a la Carta — js/i18n.js
// Internacionalización: ES / EN
// Estrategia: querySelector por selectores conocidos (sin data-i18n en HTML)
// + switcher inyectado dinámicamente en el nav

'use strict';

const LANG_KEY = 'ec_lang';
const LANG_ES  = 'es';
const LANG_EN  = 'en';

// ─── Carga de strings ────────────────────────────────────────
let _strings = null;

async function loadStrings(lang) {
  try {
    var res = await fetch('i18n/' + lang + '.json?t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.warn('[i18n] No se pudo cargar idioma "' + lang + '":', e.message);
    return {};
  }
}

// ─── Preferencia de idioma ───────────────────────────────────
export function getLang() {
  var stored = localStorage.getItem(LANG_KEY);
  if (stored === LANG_EN || stored === LANG_ES) return stored;
  return navigator.language && navigator.language.startsWith('en') ? LANG_EN : LANG_ES;
}

export function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
}

// ─── Traducción de elementos conocidos ──────────────────────
function applyStrings(s) {
  if (!s || Object.keys(s).length === 0) return;

  // Elementos con data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (s[key] !== undefined) {
      if (el.tagName === 'INPUT' && el.type !== 'submit') {
        el.placeholder = s[key];
      } else {
        el.textContent = s[key];
      }
    }
  });

  // Nav — Desktop (href-based selectors)
  var navHome = document.querySelector('nav a[href="index.html"]:not(.nav-dropdown a)');
  if (navHome && s.nav_home) navHome.textContent = s.nav_home;

  var navWeekly = document.querySelector('nav a[href="menu-semanal.html"]:not(.nav-dropdown a)');
  if (navWeekly && s.nav_weekly) {
    // Preserve aria-current & class, only update text
    var cur = navWeekly.getAttribute('aria-current');
    navWeekly.textContent = s.nav_weekly;
    if (cur) navWeekly.setAttribute('aria-current', cur);
  }

  // Nav dropdown regions/categories/about — span children of nav-item
  document.querySelectorAll('nav .nav-item > span').forEach(function(span) {
    var t = span.textContent.trim();
    if (t.startsWith('Regiones') || t.startsWith('Regions')) {
      if (s.nav_regions) span.textContent = s.nav_regions;
    } else if (t.startsWith('Categor') ) {
      if (s.nav_categories) span.textContent = s.nav_categories;
    } else if (t.startsWith('Sobre') || t.startsWith('About')) {
      if (s.nav_about) span.textContent = s.nav_about;
    }
  });

  // "Ver Recetas" CTA button
  document.querySelectorAll('a[href="recipes.html"].bg-ec-gold, a[href="recipes.html"].rounded-full').forEach(function(btn) {
    if (s.nav_btn_recipes) btn.textContent = s.nav_btn_recipes;
  });

  // Mobile nav
  var mobileNav = document.getElementById('nav-mobile');
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(function(a) {
      var href = a.getAttribute('href');
      var t = a.textContent.trim();
      if (href === 'index.html') {
        if (s.nav_home) a.textContent = s.nav_home;
      } else if (href === 'recipes.html') {
        if (s.nav_mobile_recipes) a.textContent = s.nav_mobile_recipes;
      } else if (href === 'menu-semanal.html') {
        if (s.nav_mobile_weekly) a.textContent = s.nav_mobile_weekly;
      } else if (href === 'blog.html') {
        if (s.nav_mobile_blog) a.textContent = s.nav_mobile_blog;
      } else if (href === 'nosotros.html') {
        if (s.nav_mobile_about) a.textContent = s.nav_mobile_about;
      } else if (href === 'contact.html') {
        if (s.nav_mobile_contact) a.textContent = s.nav_mobile_contact;
      }
    });
  }

  // Search placeholders
  var searchIndex = document.getElementById('search-input');
  if (searchIndex && s.search_placeholder_index) searchIndex.placeholder = s.search_placeholder_index;

  var searchListing = document.getElementById('filter-search');
  if (searchListing && s.search_placeholder_listing) searchListing.placeholder = s.search_placeholder_listing;

  var searchBlog = document.getElementById('blog-search');
  if (searchBlog && s.search_placeholder_blog) searchBlog.placeholder = s.search_placeholder_blog;

  // Regenerar menú button
  var regenBtn = document.getElementById('menu-regen');
  if (regenBtn && s.btn_regen_menu) regenBtn.textContent = s.btn_regen_menu;

  // Newsletter
  var nlTitle = document.querySelector('.newsletter-title, [data-i18n="newsletter_title"]');
  var nlSubtitle = document.querySelector('.newsletter-subtitle, [data-i18n="newsletter_subtitle"]');
  var nlCta = document.querySelector('.newsletter-cta, [data-i18n="newsletter_cta"]');
  // (only if tagged; otherwise skip to avoid overwriting static content)

  // document.documentElement lang attribute
  document.documentElement.lang = getLang();
}

// ─── Inyectar switcher en el nav ─────────────────────────────
function injectSwitcher(currentLang) {
  // Evitar duplicados
  if (document.getElementById('lang-switcher')) return;

  var btn = document.createElement('button');
  btn.id = 'lang-switcher';
  btn.type = 'button';
  btn.title = currentLang === LANG_ES ? 'Switch to English' : 'Cambiar a Español';
  btn.setAttribute('aria-label', btn.title);
  btn.style.cssText = [
    'background:rgba(255,255,255,0.15)',
    'color:#fff',
    'border:1px solid rgba(255,255,255,0.3)',
    'border-radius:8px',
    'padding:4px 8px',
    'font-size:0.75rem',
    'font-weight:700',
    'cursor:pointer',
    'letter-spacing:0.05em',
    'transition:background 0.2s',
    'white-space:nowrap'
  ].join(';');
  btn.textContent = currentLang === LANG_ES ? 'EN' : 'ES';

  btn.addEventListener('mouseenter', function() { btn.style.background = 'rgba(255,255,255,0.25)'; });
  btn.addEventListener('mouseleave', function() { btn.style.background = 'rgba(255,255,255,0.15)'; });

  btn.addEventListener('click', async function() {
    var newLang = getLang() === LANG_ES ? LANG_EN : LANG_ES;
    setLang(newLang);
    btn.textContent = newLang === LANG_ES ? 'EN' : 'ES';
    btn.title = newLang === LANG_ES ? 'Switch to English' : 'Cambiar a Español';
    var strings = await loadStrings(newLang);
    _strings = strings;
    applyStrings(strings);
  });

  // Insertar antes del toggle del menú móvil
  var navToggle = document.getElementById('nav-toggle');
  var navRightDiv = navToggle ? navToggle.parentElement : null;
  if (navRightDiv) {
    navRightDiv.insertBefore(btn, navToggle);
  } else {
    // Fallback: añadir al header
    var header = document.querySelector('header .max-w-7xl');
    if (header) header.appendChild(btn);
  }
}

// ─── Init ────────────────────────────────────────────────────
export async function initI18n() {
  var lang = getLang();
  var strings = await loadStrings(lang);
  _strings = strings;
  applyStrings(strings);
  injectSwitcher(lang);
}

// ─── Helper: t() para código JS ─────────────────────────────
export function t(key) {
  return (_strings && _strings[key]) ? _strings[key] : key;
}
