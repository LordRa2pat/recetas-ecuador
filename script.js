'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────
const SITE_NAME = 'Biblioteca de Recetas Ecuatorianas';
const RECIPES_URL = 'recipes.json';

// ─── State ────────────────────────────────────────────────────────────────────
let allRecipes = [];

// ─── Data Fetching ────────────────────────────────────────────────────────────
async function loadRecipes() {
  try {
    const res = await fetch(RECIPES_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allRecipes = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[Recetas] Failed to load recipes.json:', err.message);
    allRecipes = [];
  }
  return allRecipes;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeToISO8601(timeStr) {
  if (!timeStr) return '';
  const hMatch = timeStr.match(/(\d+)\s*h/i);
  const mMatch = timeStr.match(/(\d+)\s*min/i);
  const h = hMatch ? `${hMatch[1]}H` : '';
  const m = mMatch ? `${mMatch[1]}M` : '';
  return (h || m) ? `PT${h}${m}` : '';
}

function getDifficultyClass(difficulty) {
  const map = {
    'Fácil': 'bg-green-100 text-green-800',
    'Media': 'bg-yellow-100 text-yellow-800',
    'Difícil': 'bg-red-100 text-red-800',
  };
  return map[difficulty] || 'bg-gray-100 text-gray-700';
}

function getRegionClass(region) {
  const map = {
    'Sierra': 'bg-blue-100 text-blue-800',
    'Costa': 'bg-orange-100 text-orange-800',
    'Amazonía': 'bg-green-100 text-green-800',
    'Galápagos': 'bg-cyan-100 text-cyan-800',
    'Nacional': 'bg-purple-100 text-purple-800',
  };
  return map[region] || 'bg-gray-100 text-gray-700';
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Card Renderer ────────────────────────────────────────────────────────────
function renderCard(recipe) {
  const slug = encodeURIComponent(recipe.slug || '');
  const diffClass = getDifficultyClass(recipe.difficulty);
  const regionClass = getRegionClass(recipe.region);
  const fallbackImg = 'https://source.unsplash.com/800x600/?food,ecuador';

  return `
    <a href="recipe.html?slug=${slug}"
       class="group flex flex-col bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      <div class="relative h-48 overflow-hidden flex-shrink-0">
        <img
          src="${escapeHtml(recipe.image || fallbackImg)}"
          alt="${escapeHtml(recipe.title)}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onerror="this.src='${fallbackImg}'"
        />
        <span class="absolute top-2 right-2 text-xs font-semibold px-2.5 py-1 rounded-full ${diffClass}">
          ${escapeHtml(recipe.difficulty || '')}
        </span>
      </div>
      <div class="flex flex-col flex-1 p-4">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <span class="text-xs font-medium px-2 py-0.5 rounded-full ${regionClass}">
            ${escapeHtml(recipe.region || '')}
          </span>
          <span class="text-xs text-gray-400">${escapeHtml(recipe.category || '')}</span>
        </div>
        <h3 class="font-bold text-gray-800 text-base leading-snug mb-2 line-clamp-2
                   group-hover:text-[#006400] transition-colors duration-200">
          ${escapeHtml(recipe.title)}
        </h3>
        <p class="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">
          ${escapeHtml(recipe.description || '')}
        </p>
        <div class="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-50 pt-3">
          <span>⏱ ${escapeHtml(recipe.total_time || '—')}</span>
          <span>👥 ${escapeHtml(recipe.servings || '—')}</span>
        </div>
      </div>
    </a>
  `;
}

function renderEmptyState(container, message) {
  container.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div class="text-7xl mb-4">🍽️</div>
      <p class="text-gray-400 text-lg max-w-sm">${escapeHtml(message)}</p>
    </div>
  `;
}

// ─── Index Page ───────────────────────────────────────────────────────────────
function initIndex() {
  const grid = document.getElementById('featured-grid');
  const searchInput = document.getElementById('hero-search');
  const searchBtn = document.getElementById('hero-search-btn');
  const countBadge = document.getElementById('recipe-count');

  if (countBadge) {
    countBadge.textContent = allRecipes.length;
  }

  function renderFeatured(list) {
    if (!grid) return;
    if (list.length === 0) {
      renderEmptyState(grid, 'Las recetas están en camino. ¡Vuelve pronto!');
    } else {
      grid.innerHTML = list.slice(0, 6).map(renderCard).join('');
    }
  }

  renderFeatured(allRecipes);

  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length < 2) {
        renderFeatured(allRecipes);
        return;
      }
      const results = allRecipes.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.ingredients && r.ingredients.some(i => i.toLowerCase().includes(q))) ||
        (r.category && r.category.toLowerCase().includes(q))
      );
      if (results.length === 0) {
        renderEmptyState(grid, `Sin resultados para "${e.target.value.trim()}"`);
      } else {
        renderFeatured(results);
      }
    }, 300));

    const doSearch = () => {
      const q = searchInput.value.trim();
      if (q) {
        window.location.href = `recipes.html?q=${encodeURIComponent(q)}`;
      }
    };

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });

    if (searchBtn) searchBtn.addEventListener('click', doSearch);
  }
}

// ─── Listing Page ─────────────────────────────────────────────────────────────
function initListing() {
  const grid = document.getElementById('recipes-grid');
  const searchInput = document.getElementById('search-input');
  const regionFilter = document.getElementById('filter-region');
  const difficultyFilter = document.getElementById('filter-difficulty');
  const categoryFilter = document.getElementById('filter-category');
  const resultsCount = document.getElementById('results-count');
  const clearBtn = document.getElementById('clear-filters');

  if (!grid) return;

  // Populate dynamic filter options
  const populateSelect = (select, values) => {
    if (!select) return;
    values.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
  };

  const regions = [...new Set(allRecipes.map(r => r.region).filter(Boolean))].sort();
  const categories = [...new Set(allRecipes.map(r => r.category).filter(Boolean))].sort();

  populateSelect(regionFilter, regions);
  populateSelect(categoryFilter, categories);

  // Restore URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('q') && searchInput) searchInput.value = params.get('q');
  if (params.get('region') && regionFilter) regionFilter.value = params.get('region');
  if (params.get('category') && categoryFilter) categoryFilter.value = params.get('category');

  function applyFilters() {
    const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const region = regionFilter ? regionFilter.value : '';
    const difficulty = difficultyFilter ? difficultyFilter.value : '';
    const category = categoryFilter ? categoryFilter.value : '';

    let filtered = allRecipes;

    if (q) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.ingredients && r.ingredients.some(i => i.toLowerCase().includes(q)))
      );
    }
    if (region) filtered = filtered.filter(r => r.region === region);
    if (difficulty) filtered = filtered.filter(r => r.difficulty === difficulty);
    if (category) filtered = filtered.filter(r => r.category === category);

    if (resultsCount) {
      resultsCount.textContent = `${filtered.length} receta${filtered.length !== 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
      renderEmptyState(grid, 'Sin resultados. Intenta con otros filtros.');
    } else {
      grid.innerHTML = filtered.map(renderCard).join('');
    }
  }

  if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 300));
  if (regionFilter) regionFilter.addEventListener('change', applyFilters);
  if (difficultyFilter) difficultyFilter.addEventListener('change', applyFilters);
  if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (regionFilter) regionFilter.value = '';
      if (difficultyFilter) difficultyFilter.value = '';
      if (categoryFilter) categoryFilter.value = '';
      applyFilters();
    });
  }

  applyFilters();
}

// ─── Recipe Page ──────────────────────────────────────────────────────────────
function initRecipe() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const loader = document.getElementById('recipe-loader');
  const content = document.getElementById('recipe-content');
  const errorEl = document.getElementById('recipe-error');

  function showError(msg) {
    if (loader) loader.classList.add('hidden');
    if (errorEl) {
      errorEl.querySelector('p').textContent = msg;
      errorEl.classList.remove('hidden');
    }
  }

  if (!slug) {
    showError('No se especificó ninguna receta.');
    return;
  }

  const recipe = allRecipes.find(r => r.slug === slug);

  if (!recipe) {
    showError(`La receta "${slug}" no fue encontrada.`);
    return;
  }

  // Inject SEO tags
  injectSEO(recipe);

  // Helper to safely set textContent
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  };

  const setClass = (id, cls) => {
    const el = document.getElementById(id);
    if (el) el.className += ' ' + cls;
  };

  // Fill content
  setText('recipe-title', recipe.title);
  setText('recipe-description', recipe.description);
  setText('recipe-region', recipe.region);
  setText('recipe-category', recipe.category);
  setText('recipe-prep', recipe.prep_time);
  setText('recipe-cook', recipe.cook_time);
  setText('recipe-total', recipe.total_time);
  setText('recipe-servings', recipe.servings);
  setText('recipe-difficulty', recipe.difficulty);

  setClass('recipe-region', getRegionClass(recipe.region));
  setClass('recipe-difficulty', getDifficultyClass(recipe.difficulty));

  const img = document.getElementById('recipe-image');
  if (img) {
    img.src = recipe.image || 'https://source.unsplash.com/800x600/?food,ecuador';
    img.alt = recipe.title;
    img.onerror = () => { img.src = 'https://source.unsplash.com/800x600/?food,ecuador'; };
  }

  // Breadcrumb slug
  const breadcrumbTitle = document.getElementById('breadcrumb-title');
  if (breadcrumbTitle) breadcrumbTitle.textContent = recipe.title;

  // Ingredients
  const ingredientsList = document.getElementById('ingredients-list');
  if (ingredientsList && recipe.ingredients) {
    ingredientsList.innerHTML = recipe.ingredients.map(item => `
      <li class="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
        <span class="text-[#FFCC00] font-bold mt-0.5 flex-shrink-0 text-lg leading-none">✦</span>
        <span class="text-gray-700 text-sm leading-relaxed">${escapeHtml(item)}</span>
      </li>
    `).join('');
  }

  // Instructions
  const instructionsList = document.getElementById('instructions-list');
  if (instructionsList && recipe.instructions) {
    instructionsList.innerHTML = recipe.instructions.map((step, idx) => `
      <li class="flex gap-4 mb-6 last:mb-0">
        <div class="flex-shrink-0 w-9 h-9 bg-[#C8102E] text-white rounded-full flex items-center
                    justify-center font-bold text-sm shadow-sm">${idx + 1}</div>
        <div class="flex-1 pt-1.5">
          <p class="text-gray-700 leading-relaxed text-sm">${escapeHtml(step)}</p>
        </div>
      </li>
    `).join('');
  }

  // Tips
  const tipsList = document.getElementById('tips-list');
  if (tipsList && recipe.tips) {
    tipsList.innerHTML = recipe.tips.map(tip => `
      <li class="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border-l-4 border-[#FFCC00] mb-3 last:mb-0">
        <span class="text-xl flex-shrink-0 leading-none mt-0.5">💡</span>
        <p class="text-gray-700 text-sm leading-relaxed">${escapeHtml(tip)}</p>
      </li>
    `).join('');
  }

  // Keywords / tags
  const keywordsEl = document.getElementById('recipe-keywords');
  if (keywordsEl && recipe.keywords) {
    keywordsEl.innerHTML = recipe.keywords.map(kw => `
      <span class="inline-block bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">${escapeHtml(kw)}</span>
    `).join('');
  }

  // Show content, hide loader
  if (loader) loader.classList.add('hidden');
  if (content) content.classList.remove('hidden');
}

// ─── SEO Injection ────────────────────────────────────────────────────────────
function injectSEO(recipe) {
  // Page title
  document.title = `${recipe.title} | ${SITE_NAME}`;

  const setMeta = (attr, name, content) => {
    if (!content) return;
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('name', 'description', recipe.description);
  setMeta('name', 'keywords', (recipe.keywords || []).join(', '));

  // Open Graph
  setMeta('property', 'og:title', recipe.title);
  setMeta('property', 'og:description', recipe.description);
  setMeta('property', 'og:image', recipe.image);
  setMeta('property', 'og:url', window.location.href);
  setMeta('property', 'og:type', 'article');
  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('property', 'og:locale', 'es_EC');

  // Twitter Card
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', recipe.title);
  setMeta('name', 'twitter:description', recipe.description);
  setMeta('name', 'twitter:image', recipe.image);

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = window.location.href;

  // Schema.org JSON-LD — Recipe
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description,
    image: [recipe.image],
    recipeIngredient: recipe.ingredients || [],
    recipeInstructions: (recipe.instructions || []).map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: step,
    })),
    prepTime: timeToISO8601(recipe.prep_time),
    cookTime: timeToISO8601(recipe.cook_time),
    totalTime: timeToISO8601(recipe.total_time),
    recipeYield: recipe.servings,
    recipeCuisine: 'Ecuatoriana',
    recipeCategory: recipe.category,
    keywords: (recipe.keywords || []).join(', '),
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: window.location.origin,
    },
    datePublished: recipe.created_at
      ? recipe.created_at.split('T')[0]
      : new Date().toISOString().split('T')[0],
    inLanguage: 'es-EC',
  };

  let ldScript = document.getElementById('json-ld-recipe');
  if (!ldScript) {
    ldScript = document.createElement('script');
    ldScript.id = 'json-ld-recipe';
    ldScript.type = 'application/ld+json';
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = JSON.stringify(jsonLd, null, 2);
}

// ─── Router / Init ────────────────────────────────────────────────────────────
async function init() {
  await loadRecipes();

  const page = document.body.dataset.page;
  if (page === 'index') initIndex();
  else if (page === 'listing') initListing();
  else if (page === 'recipe') initRecipe();
}

document.addEventListener('DOMContentLoaded', init);
