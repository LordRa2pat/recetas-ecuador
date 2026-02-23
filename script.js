// ============================================================
// Biblioteca de Recetas Ecuatorianas — script.js
// Revista Premium de Gastronomía y Turismo Ecuatoriano
// ============================================================

'use strict';

// ─── Constantes ──────────────────────────────────────────────
const DATA_URL = 'recipes.json';
let allRecipes = [];

// ─── Utilidades ──────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function timeToISO8601(timeStr) {
  if (!timeStr) return '';
  const m = String(timeStr).match(/(\d+)\s*h(?:ora)?s?\s*(\d+)?\s*m?i?n?|(\d+)\s*m?i?n/i);
  if (!m) return '';
  if (m[1]) {
    const h = parseInt(m[1]);
    const min = parseInt(m[2] || 0);
    return `PT${h}H${min > 0 ? min + 'M' : ''}`;
  }
  return `PT${parseInt(m[3])}M`;
}

function parseMinutes(timeStr) {
  if (!timeStr) return 9999;
  const m = String(timeStr).match(/(\d+)\s*h(?:ora)?s?\s*(\d+)?\s*m?i?n?|(\d+)\s*m?i?n/i);
  if (!m) return 9999;
  if (m[1]) return parseInt(m[1]) * 60 + parseInt(m[2] || 0);
  return parseInt(m[3]);
}

function sortRecipes(recipes, sortBy) {
  const copy = [...recipes];
  if (sortBy === 'alpha') return copy.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  if (sortBy === 'fast') return copy.sort((a, b) => parseMinutes(a.total_time) - parseMinutes(b.total_time));
  return copy; // 'recent' = orden original (más reciente primero)
}

// ─── Carga de datos ───────────────────────────────────────────
async function loadRecipes() {
  try {
    const res = await fetch(DATA_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    allRecipes = await res.json();
    return allRecipes;
  } catch (err) {
    console.error('Error cargando recetas:', err);
    return [];
  }
}

// ─── AdSense ─────────────────────────────────────────────────
function initAds() {
  if (typeof adsbygoogle === 'undefined') return;
  document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])').forEach(() => {
    try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  });
}

function renderInFeedAd(slotId) {
  slotId = slotId || '2222222222';
  return '<div class="ad-slot ad-slot--square col-span-1 sm:col-span-2 lg:col-span-3 my-4" role="complementary" aria-label="Publicidad">' +
    '<p class="ad-label">Publicidad</p>' +
    '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXX"' +
    ' data-ad-slot="' + slotId + '" data-ad-format="auto" data-full-width-responsive="true"></ins>' +
    '</div>';
}

// ─── Audience chip ────────────────────────────────────────────
function getAudienceChip(recipe) {
  const isDiaspora = recipe.target_audience === 'Diáspora' ||
    (recipe.international_substitutes && recipe.international_substitutes.length > 0);
  const isTourism = recipe.target_audience === 'Turista' || !!recipe.tourism_route;

  if (isDiaspora) {
    return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-700 backdrop-blur-sm border border-blue-200/60">' +
      '\u2708\uFE0F Di\u00e1spora</span>';
  }
  if (isTourism) {
    return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-700 backdrop-blur-sm border border-amber-200/60">' +
      '\uD83D\uDDFA\uFE0F Turismo</span>';
  }
  return '';
}

// ─── Skeleton ────────────────────────────────────────────────
function renderSkeleton(count) {
  count = count || 3;
  var html = '';
  for (var i = 0; i < count; i++) {
    html += '<div class="bg-white rounded-3xl shadow-md overflow-hidden animate-pulse" aria-hidden="true">' +
      '<div class="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 h-52"></div>' +
      '<div class="p-5">' +
        '<div class="flex gap-2 mb-3">' +
          '<div class="bg-gray-200 h-5 w-16 rounded-full"></div>' +
          '<div class="bg-gray-200 h-4 w-12 rounded-full"></div>' +
        '</div>' +
        '<div class="bg-gray-200 h-4 rounded-full mb-2.5 w-full"></div>' +
        '<div class="bg-gray-200 h-4 rounded-full mb-4 w-4/5"></div>' +
        '<div class="flex gap-3 pt-3 border-t border-gray-100">' +
          '<div class="bg-gray-200 h-3 w-16 rounded-full"></div>' +
          '<div class="bg-gray-200 h-3 w-12 rounded-full"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  return html;
}

// ─── Card ─────────────────────────────────────────────────────
function renderCard(recipe) {
  var chip = getAudienceChip(recipe);
  var hasTourism = !!recipe.tourism_route;
  var img = recipe.image_url
    ? escapeHtml(recipe.image_url)
    : 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80';

  return '<article class="group relative bg-white rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 overflow-hidden cursor-pointer focus-within:ring-2 focus-within:ring-[#006400] focus-within:ring-offset-2">' +
    '<a href="recipe.html?slug=' + escapeHtml(recipe.slug) + '" class="block" aria-label="' + escapeHtml(recipe.title) + '">' +
      '<div class="relative h-52 overflow-hidden">' +
        '<img src="' + img + '" alt="' + escapeHtml(recipe.title) + '"' +
          ' class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"' +
          ' loading="lazy" onerror="this.src=\'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80\'">' +
        '<div class="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>' +
        (chip ? '<div class="absolute top-3 left-3">' + chip + '</div>' : '') +
        (hasTourism ? '<div class="absolute bottom-3 right-3 text-white text-lg drop-shadow-md" title="Ruta Gastron\u00f3mica">\uD83D\uDDFA\uFE0F</div>' : '') +
      '</div>' +
      '<div class="p-5">' +
        '<div class="flex flex-wrap gap-2 mb-2">' +
          (recipe.region ? '<span class="text-xs font-medium text-[#006400] bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">' + escapeHtml(recipe.region) + '</span>' : '') +
          (recipe.difficulty ? '<span class="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full">' + escapeHtml(recipe.difficulty) + '</span>' : '') +
        '</div>' +
        '<h3 class="font-bold text-gray-900 text-base leading-snug mb-1 line-clamp-2 group-hover:text-[#006400] transition-colors duration-200">' +
          escapeHtml(recipe.title) +
        '</h3>' +
        '<p class="text-gray-500 text-sm line-clamp-2 mb-3">' + escapeHtml(recipe.description || '') + '</p>' +
        '<div class="flex items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-400">' +
          (recipe.total_time ? '<span>\u23f1 ' + escapeHtml(recipe.total_time) + '</span>' : '') +
          (recipe.servings ? '<span>\uD83D\uDC65 ' + escapeHtml(recipe.servings) + '</span>' : '') +
          (recipe.category ? '<span class="ml-auto text-[#FFCC00] font-bold">' + escapeHtml(recipe.category) + '</span>' : '') +
        '</div>' +
      '</div>' +
    '</a>' +
  '</article>';
}

// ─── Estado vacío ─────────────────────────────────────────────
function renderEmptyState(containerEl, msg) {
  msg = msg || 'No hay recetas disponibles aún.';
  containerEl.innerHTML = '<div class="col-span-full flex flex-col items-center justify-center py-16 text-center text-gray-400">' +
    '<div class="text-5xl mb-4">\uD83C\uDF7D\uFE0F</div>' +
    '<p class="text-lg font-medium text-gray-500">' + escapeHtml(msg) + '</p>' +
    '<p class="text-sm mt-1">Pronto agregaremos nuevas recetas.</p>' +
    '</div>';
}

// ─── Grid con ads ─────────────────────────────────────────────
function renderGridWithAds(recipes, gridEl, adsInterval) {
  adsInterval = adsInterval || 9;
  if (!gridEl) return;
  if (recipes.length === 0) {
    renderEmptyState(gridEl, 'Sin recetas con esos filtros.');
    return;
  }
  var html = '';
  var adsInserted = 0;
  for (var i = 0; i < recipes.length; i++) {
    html += renderCard(recipes[i]);
    if ((i + 1) % adsInterval === 0 && adsInserted < 3 && i < recipes.length - 1) {
      html += renderInFeedAd('2222222222');
      adsInserted++;
    }
  }
  gridEl.innerHTML = html;
}

// ─── SEO ─────────────────────────────────────────────────────
function setMeta(title, description, imageUrl) {
  document.title = title;
  function setTag(sel, attr, val) {
    var el = document.querySelector(sel);
    if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  }
  setTag('meta[name="description"]', 'content', description);
  setTag('meta[property="og:title"]', 'content', title);
  setTag('meta[property="og:description"]', 'content', description);
  setTag('meta[property="og:image"]', 'content', imageUrl || '');
  setTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
  setTag('meta[name="twitter:title"]', 'content', title);
  setTag('meta[name="twitter:description"]', 'content', description);
}

function injectSEO(recipe) {
  setMeta(
    recipe.title + ' \u2014 Receta Ecuatoriana | Biblioteca de Recetas',
    recipe.description || ('Aprende a preparar ' + recipe.title + ', una deliciosa receta ecuatoriana.'),
    recipe.image_url
  );

  var steps = (recipe.instructions || []).map(function(step, i) {
    var text = typeof step === 'string' ? step : (step.text || step);
    return { '@type': 'HowToStep', 'position': i + 1, 'text': text };
  });

  var schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    'name': recipe.title,
    'description': recipe.description || '',
    'image': recipe.image_url || '',
    'author': { '@type': 'Organization', 'name': 'Biblioteca de Recetas Ecuatorianas' },
    'datePublished': recipe.date_published || new Date().toISOString().split('T')[0],
    'recipeCategory': recipe.category || '',
    'recipeCuisine': 'Ecuadoriana',
    'recipeYield': recipe.servings || '',
    'prepTime': timeToISO8601(recipe.prep_time),
    'cookTime': timeToISO8601(recipe.cook_time),
    'totalTime': timeToISO8601(recipe.total_time),
    'recipeIngredient': recipe.ingredients || [],
    'recipeInstructions': steps,
    'keywords': (recipe.keywords || []).join(', ')
  };

  var ld = document.querySelector('script[type="application/ld+json"]');
  if (!ld) {
    ld = document.createElement('script');
    ld.type = 'application/ld+json';
    document.head.appendChild(ld);
  }
  ld.textContent = JSON.stringify(schema);
}

// ─── Página: INDEX ────────────────────────────────────────────
async function initIndex() {
  var recipes = await loadRecipes();

  // Sección clásicas
  var classicGrid = document.getElementById('classic-grid');
  if (classicGrid) {
    var classics = recipes.filter(function(r) {
      return !r.target_audience || r.target_audience === 'Local';
    }).slice(0, 6);
    if (classics.length > 0) {
      classicGrid.innerHTML = classics.map(renderCard).join('');
    } else if (recipes.length > 0) {
      classicGrid.innerHTML = recipes.slice(0, 6).map(renderCard).join('');
    } else {
      renderEmptyState(classicGrid, 'Pronto publicaremos nuestras primeras recetas clásicas.');
    }
  }

  // Sección diáspora
  var diasporaSection = document.getElementById('diaspora-section');
  var diasporaGrid = document.getElementById('diaspora-grid');
  if (diasporaGrid) {
    var diaspora = recipes.filter(function(r) {
      return r.target_audience === 'Diáspora' ||
        (r.international_substitutes && r.international_substitutes.length > 0);
    }).slice(0, 4);
    if (diaspora.length > 0) {
      diasporaGrid.innerHTML = diaspora.map(renderCard).join('');
      if (diasporaSection) diasporaSection.classList.remove('hidden');
    }
  }

  // Sección turismo
  var tourismSection = document.getElementById('tourism-section');
  var tourismGrid = document.getElementById('tourism-grid');
  if (tourismGrid) {
    var tourism = recipes.filter(function(r) { return !!r.tourism_route; }).slice(0, 4);
    if (tourism.length > 0) {
      tourismGrid.innerHTML = tourism.map(renderCard).join('');
      if (tourismSection) tourismSection.classList.remove('hidden');
    }
  }

  // Search bar en index
  var searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var q = searchInput.value.trim();
        if (q) window.location.href = 'recipes.html?q=' + encodeURIComponent(q);
      }
    });
    var searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function() {
        var q = searchInput.value.trim();
        if (q) window.location.href = 'recipes.html?q=' + encodeURIComponent(q);
      });
    }
  }

  initAds();
}

// ─── Página: LISTADO ──────────────────────────────────────────
async function initListing() {
  var recipes = await loadRecipes();
  var grid = document.getElementById('recipes-grid');
  var resultsCount = document.getElementById('results-count');

  var searchInput = document.getElementById('filter-search');
  var regionSel = document.getElementById('filter-region');
  var difficultySel = document.getElementById('filter-difficulty');
  var categorySel = document.getElementById('filter-category');
  var audienceSel = document.getElementById('filter-audience');
  var sortSel = document.getElementById('filter-sort');
  var clearBtn = document.getElementById('clear-filters');

  // Poblar filtros con valores únicos
  function populate(sel, key) {
    if (!sel) return;
    var seen = {};
    var values = [];
    recipes.forEach(function(r) {
      if (r[key] && !seen[r[key]]) { seen[r[key]] = true; values.push(r[key]); }
    });
    values.sort(function(a, b) { return a.localeCompare(b, 'es'); });
    values.forEach(function(v) {
      var opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    });
  }
  populate(regionSel, 'region');
  populate(difficultySel, 'difficulty');
  populate(categorySel, 'category');

  // Aplicar parámetros URL
  var params = new URLSearchParams(window.location.search);
  if (searchInput && params.get('q')) searchInput.value = params.get('q');
  if (regionSel && params.get('region')) regionSel.value = params.get('region');
  if (audienceSel && params.get('audience')) audienceSel.value = params.get('audience');

  function applyFilters() {
    var q = searchInput ? searchInput.value.toLowerCase().trim() : '';
    var region = regionSel ? regionSel.value : '';
    var difficulty = difficultySel ? difficultySel.value : '';
    var category = categorySel ? categorySel.value : '';
    var audience = audienceSel ? audienceSel.value : '';
    var sort = sortSel ? sortSel.value : 'recent';

    var filtered = recipes.filter(function(r) {
      if (q) {
        var haystack = (r.title + ' ' + (r.description || '') + ' ' + (r.keywords || []).join(' ')).toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }
      if (region && r.region !== region) return false;
      if (difficulty && r.difficulty !== difficulty) return false;
      if (category && r.category !== category) return false;
      if (audience) {
        if (audience === 'Diáspora') {
          if (r.target_audience !== 'Diáspora' && !(r.international_substitutes && r.international_substitutes.length > 0)) return false;
        } else if (audience === 'Turista') {
          if (r.target_audience !== 'Turista' && !r.tourism_route) return false;
        } else {
          if (r.target_audience && r.target_audience !== audience) return false;
        }
      }
      return true;
    });

    filtered = sortRecipes(filtered, sort);

    if (resultsCount) {
      resultsCount.textContent = filtered.length === 1
        ? '1 receta encontrada'
        : filtered.length + ' recetas encontradas';
    }

    renderGridWithAds(filtered, grid, 9);
    initAds();
  }

  // Listeners
  var debouncedApply = debounce(applyFilters, 300);
  if (searchInput) searchInput.addEventListener('input', debouncedApply);
  if (regionSel) regionSel.addEventListener('change', applyFilters);
  if (difficultySel) difficultySel.addEventListener('change', applyFilters);
  if (categorySel) categorySel.addEventListener('change', applyFilters);
  if (audienceSel) audienceSel.addEventListener('change', applyFilters);
  if (sortSel) sortSel.addEventListener('change', applyFilters);

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (searchInput) searchInput.value = '';
      if (regionSel) regionSel.value = '';
      if (difficultySel) difficultySel.value = '';
      if (categorySel) categorySel.value = '';
      if (audienceSel) audienceSel.value = '';
      if (sortSel) sortSel.value = 'recent';
      applyFilters();
    });
  }

  // Render inicial
  if (grid) grid.innerHTML = renderSkeleton(6);
  applyFilters();
}

// ─── Página: RECETA ───────────────────────────────────────────
async function initRecipe() {
  var params = new URLSearchParams(window.location.search);
  var slug = params.get('slug');

  var loadingEl = document.getElementById('recipe-loading');
  var errorEl = document.getElementById('recipe-error');
  var contentEl = document.getElementById('recipe-content');

  if (!slug) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) {
      errorEl.classList.remove('hidden');
      var msgEl = errorEl.querySelector('[data-error-msg]');
      if (msgEl) msgEl.textContent = 'No se especificó ninguna receta.';
    }
    return;
  }

  var recipes = await loadRecipes();
  var recipe = null;
  for (var i = 0; i < recipes.length; i++) {
    if (recipes[i].slug === slug) { recipe = recipes[i]; break; }
  }

  if (loadingEl) loadingEl.classList.add('hidden');

  if (!recipe) {
    if (errorEl) {
      errorEl.classList.remove('hidden');
      var msgEl2 = errorEl.querySelector('[data-error-msg]');
      if (msgEl2) msgEl2.textContent = 'No encontramos la receta "' + escapeHtml(slug) + '".';
    }
    return;
  }

  if (contentEl) contentEl.classList.remove('hidden');

  // SEO
  injectSEO(recipe);

  // Breadcrumb
  var bcRecipe = document.getElementById('bc-recipe');
  if (bcRecipe) bcRecipe.textContent = recipe.title;

  // Hero imagen
  var heroImg = document.getElementById('recipe-hero-img');
  if (heroImg) {
    var imgSrc = recipe.image_url || 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200&q=80';
    heroImg.src = imgSrc;
    heroImg.alt = recipe.title;
    heroImg.onerror = function() { this.src = 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200&q=80'; };
  }

  // Audience chip en héroe
  var heroChip = document.getElementById('recipe-audience-chip');
  if (heroChip) {
    var chip = getAudienceChip(recipe);
    if (chip) { heroChip.innerHTML = chip; heroChip.classList.remove('hidden'); }
  }

  // Campos básicos
  var fields = [
    ['recipe-title', recipe.title],
    ['recipe-description', recipe.description],
    ['recipe-region', recipe.region],
    ['recipe-difficulty', recipe.difficulty],
    ['recipe-category', recipe.category],
    ['recipe-servings', recipe.servings],
    ['recipe-prep-time', recipe.prep_time],
    ['recipe-cook-time', recipe.cook_time],
    ['recipe-total-time', recipe.total_time]
  ];
  fields.forEach(function(pair) {
    var el = document.getElementById(pair[0]);
    if (el && pair[1]) {
      el.textContent = pair[1];
    } else if (el && !pair[1]) {
      var parent = el.closest('[data-optional]');
      if (parent) parent.classList.add('hidden');
    }
  });

  // Ingredientes
  var ingList = document.getElementById('ingredients-list');
  if (ingList && recipe.ingredients && recipe.ingredients.length > 0) {
    ingList.innerHTML = recipe.ingredients.map(function(ing) {
      return '<li class="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">' +
        '<span class="text-[#006400] mt-0.5 flex-shrink-0">\u2713</span>' +
        '<span class="text-gray-700">' + escapeHtml(ing) + '</span>' +
        '</li>';
    }).join('');
  }

  // Instrucciones
  var instrList = document.getElementById('instructions-list');
  if (instrList && recipe.instructions && recipe.instructions.length > 0) {
    instrList.innerHTML = recipe.instructions.map(function(step, i) {
      var text = typeof step === 'string' ? step : (step.text || step);
      return '<li class="flex gap-4 mb-5">' +
        '<div class="flex-shrink-0 w-8 h-8 rounded-full bg-[#006400] text-white flex items-center justify-center font-bold text-sm">' + (i + 1) + '</div>' +
        '<p class="text-gray-700 leading-relaxed pt-1">' + escapeHtml(text) + '</p>' +
        '</li>';
    }).join('');
  }

  // Tips
  var tipsList = document.getElementById('tips-list');
  if (tipsList && recipe.tips && recipe.tips.length > 0) {
    tipsList.innerHTML = recipe.tips.map(function(tip) {
      return '<li class="flex gap-2 py-1.5">' +
        '<span class="text-[#FFCC00] flex-shrink-0 mt-0.5">\uD83D\uDCA1</span>' +
        '<span class="text-gray-700">' + escapeHtml(tip) + '</span>' +
        '</li>';
    }).join('');
    var tipsParent = tipsList.closest('[data-optional]');
    if (tipsParent) tipsParent.classList.remove('hidden');
  }

  // Keywords
  var kwEl = document.getElementById('recipe-keywords');
  if (kwEl && recipe.keywords && recipe.keywords.length > 0) {
    kwEl.innerHTML = recipe.keywords.map(function(kw) {
      return '<a href="recipes.html?q=' + encodeURIComponent(kw) + '" class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-[#006400] hover:text-white transition-colors duration-200">' + escapeHtml(kw) + '</a>';
    }).join('');
    var kwParent = kwEl.closest('[data-optional]');
    if (kwParent) kwParent.classList.remove('hidden');
  }

  // ── Tarjeta de sustitutos internacionales (Diáspora) ──
  var subEl = document.getElementById('substitutes-card');
  if (subEl && recipe.international_substitutes && recipe.international_substitutes.length > 0) {
    var subsRows = recipe.international_substitutes.map(function(s) {
      return '<tr class="border-b border-blue-100/60 last:border-0">' +
        '<td class="py-2 pr-3 font-medium text-gray-800">' + escapeHtml(s.original || '') + '</td>' +
        '<td class="py-2 pr-3 text-gray-600">' + escapeHtml(s.sustituto_usa || '-') + '</td>' +
        '<td class="py-2 text-gray-600">' + escapeHtml(s.sustituto_europa || '-') + '</td>' +
        '</tr>';
    }).join('');
    subEl.innerHTML = '<div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-3xl p-5 backdrop-blur-sm">' +
      '<h3 class="font-bold text-blue-800 text-sm mb-3 flex items-center gap-2">' +
        '\u2708\uFE0F Ingredientes en el Extranjero' +
      '</h3>' +
      '<p class="text-blue-600 text-xs mb-4">\u00bfEst\u00e1s fuera de Ecuador? Estos son los equivalentes que puedes encontrar.</p>' +
      '<div class="overflow-x-auto"><table class="w-full text-xs">' +
        '<thead><tr class="text-blue-600 font-semibold border-b border-blue-200/60">' +
          '<th class="text-left pb-2 pr-3">Original (Ecuador)</th>' +
          '<th class="text-left pb-2 pr-3">\uD83C\uDDFA\uD83C\uDDF8 EE.UU.</th>' +
          '<th class="text-left pb-2">\uD83C\uDDEA\uD83C\uDDF8 Europa</th>' +
        '</tr></thead>' +
        '<tbody>' + subsRows + '</tbody>' +
      '</table></div>' +
    '</div>';
    subEl.classList.remove('hidden');
  }

  // ── Tarjeta de ruta turística ──
  var tourEl = document.getElementById('tourism-card');
  if (tourEl && recipe.tourism_route) {
    tourEl.innerHTML = '<div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl p-5 backdrop-blur-sm">' +
      '<h3 class="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">' +
        '\uD83D\uDDFA\uFE0F Ruta Gastron\u00f3mica 2026' +
      '</h3>' +
      '<p class="text-amber-700 leading-relaxed text-sm">' + escapeHtml(recipe.tourism_route) + '</p>' +
      '</div>';
    tourEl.classList.remove('hidden');
  }

  initAds();
}

// ─── Router ───────────────────────────────────────────────────
(function router() {
  var path = window.location.pathname.split('/').pop() || 'index.html';
  if (path === 'index.html' || path === '' || path === '/') {
    initIndex();
  } else if (path === 'recipes.html') {
    initListing();
  } else if (path === 'recipe.html') {
    initRecipe();
  }
})();
