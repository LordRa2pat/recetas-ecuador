// Ecuador a la Carta — js/data.js
// Carga de datos: loadRecipes, loadPosts, loadPriceDb, showDataError

'use strict';

import { escapeHtml } from './utils.js';

const DATA_URL = 'recipes.json';
const POSTS_URL = 'posts.json';
const PRICES_URL = 'price_db.json';

let allRecipes = [];
let priceDbCache = null;

export function showDataError(containerId, msg, retryFn) {
  var el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML =
    '<div class="col-span-full flex flex-col items-center gap-3 py-12 text-center">' +
    '<span class="text-4xl" aria-hidden="true">\u26A0\uFE0F</span>' +
    '<p class="text-gray-600 text-sm">' + escapeHtml(msg) + '</p>' +
    (retryFn
      ? '<button onclick="location.reload()" ' +
      'class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">' +
      'Intentar de nuevo</button>'
      : '') +
    '</div>';
}

export async function loadRecipes() {
  console.log("[js/data.js] Iniciando fetch de recetas...");
  try {
    var res = await fetch(DATA_URL + '?t=' + Date.now());
    console.log("[js/data.js] Respuesta de recetas:", res.status);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    allRecipes = await res.json();
    console.log("[js/data.js] Recetas parseadas:", allRecipes.length);
    return allRecipes;
  } catch (err) {
    console.error('[js/data.js] Error en loadRecipes:', err);
    showDataError('recipe-featured-grid', 'No pudimos cargar las recetas. Revisa tu conexi\u00f3n.', true);
    showDataError('recipes-grid', 'No pudimos cargar las recetas.', false);
    return [];
  }
}

export async function loadPriceDb() {
  if (priceDbCache) return priceDbCache;
  try {
    var res = await fetch(PRICES_URL + '?t=' + Date.now());
    if (!res.ok) return {};
    priceDbCache = await res.json();
    return priceDbCache;
  } catch (err) {
    console.warn('Precios no disponibles, continuando sin comparativa');
    return {};
  }
}

export async function loadPosts() {
  console.log("[js/data.js] Iniciando fetch de posts...");
  try {
    var res = await fetch(POSTS_URL + '?t=' + Date.now());
    console.log("[js/data.js] Respuesta de posts:", res.status);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    console.log("[js/data.js] Posts parseados:", data.length);
    return data;
  } catch (err) {
    console.error('[js/data.js] Error en loadPosts:', err);
    showDataError('blog-preview-grid', 'No pudimos cargar el blog.', true);
    showDataError('blog-grid', 'No pudimos cargar los art\u00edculos.', false);
    return [];
  }
}
