// Ecuador a la Carta — js/i18n.js
// Internacionalización: ES / EN (Blindaje V3.5.4)

'use strict';

const LANG_KEY = 'ec_lang';
const LANG_ES = 'es';
const LANG_EN = 'en';

let _strings = {};

async function loadStrings(lang) {
  try {
    const res = await fetch('i18n/' + lang + '.json?v=' + Date.now());
    if (!res.ok) return {};
    return await res.json();
  } catch (e) {
    console.warn('[i18n] Fallback activo:', e.message);
    return {};
  }
}

export function getLang() {
  try {
    var stored = localStorage.getItem(LANG_KEY);
    if (stored === LANG_EN || stored === LANG_ES) return stored;
  } catch (e) { }
  return navigator.language && navigator.language.startsWith('en') ? LANG_EN : LANG_ES;
}

export function setLang(lang) {
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) { }
}

function applyStrings(s) {
  if (!s || Object.keys(s).length === 0) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (s[key]) {
      if (el.tagName === 'INPUT' && el.type !== 'submit') el.placeholder = s[key];
      else el.textContent = s[key];
    }
  });
}

export async function initI18n() {
  try {
    const lang = getLang();
    _strings = await loadStrings(lang);
    applyStrings(_strings);
    console.log("[i18n] Inicializado v3.5.4");
  } catch (e) {
    console.error("[i18n] Error crítico:", e);
  }
}

export function t(key) {
  return (_strings && _strings[key]) ? _strings[key] : key;
}
