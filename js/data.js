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
  try {
    var res = await fetch(DATA_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    allRecipes = await res.json();
    return allRecipes;
  } catch (err) {
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
  try {
    var res = await fetch(POSTS_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    console.error('Error cargando posts:', err);
    showDataError('blog-preview-grid', 'No pudimos cargar el blog.', true);
    showDataError('blog-grid', 'No pudimos cargar los art\u00edculos.', false);
    return [];
  }
}
