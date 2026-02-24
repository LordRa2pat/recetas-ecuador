// ============================================================
// Ecuador a la Carta — script.js v5
// Rebranding #0033A0 + Ticket Ingredients + Social Share + EN/ES + Menú Semanal
// ============================================================

'use strict';

const DATA_URL = 'recipes.json';
const POSTS_URL = 'posts.json';
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

function debounce(fn, delay) {
  delay = delay || 250;
  var timer;
  return function() {
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(null, args); }, delay);
  };
}

function timeToISO8601(timeStr) {
  if (!timeStr) return '';
  var m = String(timeStr).match(/(\d+)\s*h(?:ora)?s?\s*(\d+)?\s*m?i?n?|(\d+)\s*m?i?n/i);
  if (!m) return '';
  if (m[1]) {
    var h = parseInt(m[1]);
    var min = parseInt(m[2] || 0);
    return 'PT' + h + 'H' + (min > 0 ? min + 'M' : '');
  }
  return 'PT' + parseInt(m[3]) + 'M';
}

function parseMinutes(timeStr) {
  if (!timeStr) return 9999;
  var m = String(timeStr).match(/(\d+)\s*h(?:ora)?s?\s*(\d+)?\s*m?i?n?|(\d+)\s*m?i?n/i);
  if (!m) return 9999;
  if (m[1]) return parseInt(m[1]) * 60 + parseInt(m[2] || 0);
  return parseInt(m[3]);
}

function sortRecipes(recipes, sortBy) {
  var copy = recipes.slice();
  if (sortBy === 'alpha') return copy.sort(function(a, b) { return a.title.localeCompare(b.title, 'es'); });
  if (sortBy === 'fast') return copy.sort(function(a, b) { return parseMinutes(a.total_time) - parseMinutes(b.total_time); });
  return copy;
}

// ─── Carga de datos ───────────────────────────────────────────
async function loadRecipes() {
  try {
    var res = await fetch(DATA_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    allRecipes = await res.json();
    return allRecipes;
  } catch (err) {
    console.error('Error cargando recetas:', err);
    return [];
  }
}

async function loadPosts() {
  try {
    var res = await fetch(POSTS_URL + '?t=' + Date.now());
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}

// ─── AdSense ─────────────────────────────────────────────────
function initAds() {
  if (typeof adsbygoogle === 'undefined') return;
  document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])').forEach(function() {
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
  var isDiaspora = recipe.target_audience === 'Di\u00e1spora' ||
    (recipe.international_substitutes && recipe.international_substitutes.length > 0);
  var isTourism = recipe.target_audience === 'Turista' || !!recipe.tourism_route ||
    (recipe.places && recipe.places.length > 0);
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
  var hasTourism = !!recipe.tourism_route || (recipe.places && recipe.places.length > 0);
  var hasVideos = !!(recipe.youtube_videos && recipe.youtube_videos.length > 0);
  var img = recipe.image_url
    ? escapeHtml(recipe.image_url)
    : 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80';
  var imgAlt = escapeHtml(recipe.image_alt || recipe.title);

  return '<article class="group relative bg-white rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 overflow-hidden cursor-pointer focus-within:ring-2 focus-within:ring-[#0033A0] focus-within:ring-offset-2">' +
    '<a href="recipe.html?slug=' + encodeURIComponent(recipe.slug) + '" class="block" aria-label="' + escapeHtml(recipe.title) + '">' +
      '<div class="relative h-52 overflow-hidden">' +
        '<img src="' + img + '" alt="' + imgAlt + '"' +
          ' class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"' +
          ' loading="lazy" onerror="this.src=\'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80\'">' +
        '<div class="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>' +
        (chip ? '<div class="absolute top-3 left-3">' + chip + '</div>' : '') +
        '<div class="absolute bottom-3 right-3 flex gap-1.5">' +
          (hasTourism ? '<span class="text-white text-base drop-shadow-md" title="Ruta Gastron\u00f3mica">\uD83D\uDDFA\uFE0F</span>' : '') +
          (hasVideos ? '<span class="text-white text-base drop-shadow-md" title="Video tutorial">\u25B6\uFE0F</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="p-5">' +
        '<div class="flex flex-wrap gap-2 mb-2">' +
          (recipe.region ? '<span class="text-xs font-medium text-[#0033A0] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">' + escapeHtml(recipe.region) + '</span>' : '') +
          (recipe.difficulty ? '<span class="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full">' + escapeHtml(recipe.difficulty) + '</span>' : '') +
        '</div>' +
        '<h3 class="font-bold text-gray-900 text-base leading-snug mb-1 clamp-2 group-hover:text-[#0033A0] transition-colors duration-200">' +
          escapeHtml(recipe.title) +
        '</h3>' +
        '<p class="text-gray-500 text-sm clamp-2 mb-3">' + escapeHtml(recipe.description || '') + '</p>' +
        '<div class="flex items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-400">' +
          (recipe.total_time ? '<span>\u23f1 ' + escapeHtml(recipe.total_time) + '</span>' : '') +
          (recipe.servings ? '<span>\uD83D\uDC65 ' + escapeHtml(recipe.servings) + '</span>' : '') +
          (recipe.category ? '<span class="ml-auto text-[#FFD100] font-bold">' + escapeHtml(recipe.category) + '</span>' : '') +
        '</div>' +
      '</div>' +
    '</a>' +
  '</article>';
}

// ─── Places Card ─────────────────────────────────────────────
function renderPlacesCard(recipe) {
  var el = document.getElementById('places-card');
  if (!el || !recipe.places || recipe.places.length === 0) return;

  var places = recipe.places;
  var firstPlace = places[0];
  var mapEmbed = '';

  if (firstPlace.lat && firstPlace.lng) {
    mapEmbed = '<div class="rounded-2xl overflow-hidden mb-4 border border-amber-200/40" style="height:200px">' +
      '<iframe src="https://www.google.com/maps?q=' + encodeURIComponent(firstPlace.lat + ',' + firstPlace.lng) + '&z=14&output=embed"' +
      ' width="100%" height="200" style="border:0;" allowfullscreen="" loading="lazy"' +
      ' referrerpolicy="strict-origin-when-cross-origin"' +
      ' title="Ubicaci\u00f3n de ' + escapeHtml(firstPlace.name) + '"></iframe>' +
      '</div>';
  }

  var placesHTML = places.map(function(place) {
    var mapsUrl = place.googleMapsUri ||
      (place.place_id ? 'https://www.google.com/maps/place/?q=place_id:' + encodeURIComponent(place.place_id) : '') ||
      (place.lat && place.lng ? 'https://www.google.com/maps?q=' + place.lat + ',' + place.lng : '') ||
      ('https://www.google.com/maps/search/' + encodeURIComponent((place.name || '') + ' ' + (place.city || '') + ' Ecuador'));

    var starsHTML = '';
    if (place.rating) {
      starsHTML = '<span class="text-amber-400 text-xs">\u2605 ' + parseFloat(place.rating).toFixed(1) + '</span>' +
        (place.userRatingCount ? '<span class="text-gray-400 text-xs ml-1">(' + place.userRatingCount + ')</span>' : '');
    }

    return '<div class="flex items-start gap-3 py-3 border-b border-amber-100/60 last:border-0">' +
      '<div class="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">\uD83D\uDCCD</div>' +
      '<div class="flex-1 min-w-0">' +
        '<p class="font-semibold text-gray-800 text-sm leading-tight">' + escapeHtml(place.name || '') + '</p>' +
        '<p class="text-amber-700 text-xs mt-0.5">' + escapeHtml(place.city || place.region || '') + '</p>' +
        (starsHTML ? '<div class="flex items-center gap-1 mt-0.5">' + starsHTML + '</div>' : '') +
      '</div>' +
      '<a href="' + escapeHtml(mapsUrl) + '" target="_blank" rel="noopener noreferrer"' +
        ' class="flex-shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-xl hover:bg-amber-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"' +
        ' aria-label="Ver ' + escapeHtml(place.name || '') + ' en Google Maps">' +
        'Ver mapa \u2192' +
      '</a>' +
    '</div>';
  }).join('');

  el.innerHTML = '<div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl p-5 backdrop-blur-sm">' +
    '<h3 class="font-bold text-amber-800 text-sm mb-1 flex items-center gap-2">\uD83D\uDCCD D\u00f3nde comerlo en Ecuador</h3>' +
    '<p class="text-amber-600 text-xs mb-4">Restaurantes y mercados locales donde probar este plato.</p>' +
    mapEmbed +
    '<div>' + placesHTML + '</div>' +
    '</div>';
  el.classList.remove('hidden');
}

// ─── Videos Card ─────────────────────────────────────────────
function renderVideosCard(recipe) {
  var el = document.getElementById('videos-card');
  if (!el || !recipe.youtube_videos || recipe.youtube_videos.length === 0) return;

  var videos = recipe.youtube_videos.slice(0, 3);
  var videosHTML = videos.map(function(video, i) {
    if (!video.videoId) return '';
    var embedUrl = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(video.videoId) + '?rel=0&modestbranding=1';
    return '<div' + (i > 0 ? ' class="mt-4"' : '') + '>' +
      '<div class="relative rounded-2xl overflow-hidden bg-black" style="padding-bottom:56.25%;height:0">' +
        '<iframe src="' + embedUrl + '"' +
          ' title="' + escapeHtml(video.title || recipe.title) + '"' +
          ' style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"' +
          ' loading="lazy" referrerpolicy="strict-origin-when-cross-origin"' +
          ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"' +
          ' allowfullscreen></iframe>' +
      '</div>' +
      (video.title ? '<p class="text-xs text-gray-500 mt-2 font-medium">' + escapeHtml(video.title) + '</p>' : '') +
      (video.channel ? '<p class="text-xs text-gray-400">' + escapeHtml(video.channel) + '</p>' : '') +
    '</div>';
  }).join('');

  if (!videosHTML.trim()) return;

  el.innerHTML = '<div class="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/60 rounded-3xl p-5 backdrop-blur-sm">' +
    '<h3 class="font-bold text-red-800 text-sm mb-1 flex items-center gap-2">\u25B6\uFE0F Tutoriales en YouTube</h3>' +
    '<p class="text-red-600 text-xs mb-4">Aprende a preparar este plato con estos videos.</p>' +
    videosHTML +
    '</div>';
  el.classList.remove('hidden');
}

// ─── Image Credit ─────────────────────────────────────────────
function renderImageCredit(recipe) {
  var el = document.getElementById('image-credit');
  if (!el || !recipe.image_credit) return;

  var c = recipe.image_credit;
  var parts = ['Cr\u00e9dito de imagen'];
  if (c.author) parts.push(': ' + escapeHtml(c.author));
  if (c.source) parts.push(' v\u00eda ' + escapeHtml(c.source));
  if (c.license) parts.push(' \u2014 ' + escapeHtml(c.license));
  var text = parts.join('');

  el.innerHTML = c.url
    ? '<a href="' + escapeHtml(c.url) + '" target="_blank" rel="noopener noreferrer"' +
      ' class="text-xs text-gray-400 hover:text-gray-600 transition-colors">' + text + ' \uD83D\uDD17</a>'
    : '<span class="text-xs text-gray-400">' + text + '</span>';
  el.classList.remove('hidden');
}

// ─── Estado vacío ─────────────────────────────────────────────
function renderEmptyState(containerEl, msg) {
  msg = msg || 'No hay recetas disponibles a\u00fan.';
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

// ─── SEO meta upsert ─────────────────────────────────────────
function upsertMeta(attrName, attrValue, content) {
  var sel = 'meta[' + attrName + '="' + CSS.escape(attrValue) + '"]';
  var el;
  try { el = document.querySelector(sel); } catch(e) { el = null; }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMeta(title, description, imageUrl, canonicalUrl) {
  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:type', 'article');
  if (imageUrl) upsertMeta('property', 'og:image', imageUrl);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  if (imageUrl) upsertMeta('name', 'twitter:image', imageUrl);

  if (canonicalUrl) {
    var canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }
}

function injectSEO(recipe) {
  var canonicalUrl = 'https://ecuadoralacarta.com/recipe.html?slug=' + encodeURIComponent(recipe.slug);
  var imageUrl = recipe.image_url || '';
  var keywords = (recipe.keywords || []);
  var allKeywords = keywords.concat(['recetas ecuatorianas', 'cocina ecuatoriana', 'gastronomia ecuatoriana', 'Ecuador a la Carta']).join(', ');

  setMeta(
    recipe.title + ' \u2014 Receta Ecuatoriana Aut\u00e9ntica | Cocina Ecuador \uD83C\uDDEA\uD83C\uDDE8',
    recipe.description || ('Aprende a preparar ' + recipe.title + ', una deliciosa receta ecuatoriana tradicional.'),
    imageUrl,
    canonicalUrl
  );
  upsertMeta('name', 'keywords', allKeywords);

  var steps = (recipe.instructions || []).map(function(step, i) {
    var text = typeof step === 'string' ? step : (step.text || step);
    return { '@type': 'HowToStep', 'position': i + 1, 'text': text };
  });

  var schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    'name': recipe.title,
    'description': recipe.description || '',
    'image': imageUrl,
    'author': { '@type': 'Organization', 'name': 'Ecuador a la Carta', 'url': 'https://ecuadoralacarta.com' },
    'publisher': { '@type': 'Organization', 'name': 'Ecuador a la Carta' },
    'datePublished': recipe.date_published || new Date().toISOString().split('T')[0],
    'recipeCategory': recipe.category || '',
    'recipeCuisine': 'Ecuadorian',
    'recipeYield': recipe.servings || '',
    'prepTime': timeToISO8601(recipe.prep_time),
    'cookTime': timeToISO8601(recipe.cook_time),
    'totalTime': timeToISO8601(recipe.total_time),
    'recipeIngredient': recipe.ingredients || [],
    'recipeInstructions': steps,
    'keywords': allKeywords,
    'countryOfOrigin': { '@type': 'Country', 'name': 'Ecuador' }
  };

  // VideoObject
  if (recipe.youtube_videos && recipe.youtube_videos.length > 0) {
    var validVideos = recipe.youtube_videos.filter(function(v) { return !!v.videoId; });
    if (validVideos.length > 0) {
      schema.video = validVideos.map(function(v) {
        var obj = {
          '@type': 'VideoObject',
          'name': v.title || recipe.title,
          'embedUrl': 'https://www.youtube-nocookie.com/embed/' + v.videoId,
          'thumbnailUrl': 'https://img.youtube.com/vi/' + v.videoId + '/hqdefault.jpg',
          'publisher': { '@type': 'Organization', 'name': v.channel || 'YouTube' }
        };
        if (v.uploadDate) obj.uploadDate = v.uploadDate;
        if (v.description) obj.description = v.description;
        return obj;
      });
    }
  }

  // BreadcrumbList
  var breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': 'https://ecuadoralacarta.com/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Recetas', 'item': 'https://ecuadoralacarta.com/recipes.html' },
      { '@type': 'ListItem', 'position': 3, 'name': recipe.title, 'item': canonicalUrl }
    ]
  };

  // FAQPage si hay faqs
  var schemas = [schema, breadcrumb];
  if (recipe.faqs && recipe.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': recipe.faqs.map(function(faq) {
        return {
          '@type': 'Question',
          'name': faq.q,
          'acceptedAnswer': { '@type': 'Answer', 'text': faq.a }
        };
      })
    });
  }

  var ld = document.querySelector('script[type="application/ld+json"]');
  if (!ld) {
    ld = document.createElement('script');
    ld.type = 'application/ld+json';
    document.head.appendChild(ld);
  }
  ld.textContent = JSON.stringify(schemas);
}

// ─── FAQs de receta ───────────────────────────────────────────
function renderFaqsSection(recipe) {
  var el = document.getElementById('faqs-section');
  if (!el || !recipe.faqs || recipe.faqs.length === 0) return;
  el.innerHTML = '<div class="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">' +
    '<div class="bg-gradient-to-r from-[#0033A0] to-[#001f6e] px-5 py-4">' +
      '<h2 class="text-white font-bold text-base flex items-center gap-2">❓ Preguntas Frecuentes</h2>' +
    '</div>' +
    '<div class="divide-y divide-gray-100">' +
    recipe.faqs.map(function(faq) {
      return '<details class="group px-5 py-4 cursor-pointer">' +
        '<summary class="font-semibold text-gray-800 text-sm list-none flex items-center justify-between gap-2">' +
          '<span>' + escapeHtml(faq.q) + '</span>' +
          '<span class="text-[#0033A0] font-bold text-lg group-open:rotate-45 transition-transform duration-200 flex-shrink-0">+</span>' +
        '</summary>' +
        '<p class="text-gray-600 text-sm mt-2 leading-relaxed">' + escapeHtml(faq.a) + '</p>' +
      '</details>';
    }).join('') +
    '</div></div>';
  el.classList.remove('hidden');
}

// ─── Página: INDEX ────────────────────────────────────────────
async function initIndex() {
  var recipes = await loadRecipes();

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
      renderEmptyState(classicGrid, 'Pronto publicaremos nuestras primeras recetas cl\u00e1sicas.');
    }
  }

  var diasporaSection = document.getElementById('diaspora-section');
  var diasporaGrid = document.getElementById('diaspora-grid');
  if (diasporaGrid) {
    var diaspora = recipes.filter(function(r) {
      return r.target_audience === 'Di\u00e1spora' ||
        (r.international_substitutes && r.international_substitutes.length > 0);
    }).slice(0, 4);
    if (diaspora.length > 0) {
      diasporaGrid.innerHTML = diaspora.map(renderCard).join('');
      if (diasporaSection) diasporaSection.classList.remove('hidden');
    }
  }

  var tourismSection = document.getElementById('tourism-section');
  var tourismGrid = document.getElementById('tourism-grid');
  if (tourismGrid) {
    var tourism = recipes.filter(function(r) {
      return !!r.tourism_route || (r.places && r.places.length > 0);
    }).slice(0, 4);
    if (tourism.length > 0) {
      tourismGrid.innerHTML = tourism.map(renderCard).join('');
      if (tourismSection) tourismSection.classList.remove('hidden');
    }
  }

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

  function populate(sel, key) {
    if (!sel) return;
    var seen = {}, values = [];
    recipes.forEach(function(r) {
      if (r[key] && !seen[r[key]]) { seen[r[key]] = true; values.push(r[key]); }
    });
    values.sort(function(a, b) { return a.localeCompare(b, 'es'); });
    values.forEach(function(v) {
      var opt = document.createElement('option');
      opt.value = v; opt.textContent = v;
      sel.appendChild(opt);
    });
  }
  populate(regionSel, 'region');
  populate(difficultySel, 'difficulty');
  populate(categorySel, 'category');

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
        if (audience === 'Di\u00e1spora') {
          if (r.target_audience !== 'Di\u00e1spora' &&
              !(r.international_substitutes && r.international_substitutes.length > 0)) return false;
        } else if (audience === 'Turista') {
          if (r.target_audience !== 'Turista' && !r.tourism_route &&
              !(r.places && r.places.length > 0)) return false;
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
      if (msgEl) msgEl.textContent = 'No se especific\u00f3 ninguna receta.';
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

  injectSEO(recipe);

  var bcRecipe = document.getElementById('bc-recipe');
  if (bcRecipe) bcRecipe.textContent = recipe.title;

  var heroImg = document.getElementById('recipe-hero-img');
  if (heroImg) {
    heroImg.src = recipe.image_url || 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200&q=80';
    heroImg.alt = recipe.image_alt || recipe.title;
    heroImg.onerror = function() { this.src = 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200&q=80'; };
  }

  var heroChip = document.getElementById('recipe-audience-chip');
  if (heroChip) {
    var chip = getAudienceChip(recipe);
    if (chip) { heroChip.innerHTML = chip; heroChip.classList.remove('hidden'); }
  }

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

  var ingList = document.getElementById('ingredients-list');
  if (ingList && recipe.ingredients && recipe.ingredients.length > 0) {
    ingList.innerHTML = recipe.ingredients.map(renderIngredient).join('');
  }

  var instrList = document.getElementById('instructions-list');
  if (instrList && recipe.instructions && recipe.instructions.length > 0) {
    instrList.innerHTML = recipe.instructions.map(function(step, i) {
      var text = typeof step === 'string' ? step : (step.text || step);
      return '<li class="flex gap-4 mb-5">' +
        '<div class="flex-shrink-0 w-8 h-8 rounded-full bg-[#0033A0] text-white flex items-center justify-center font-bold text-sm">' + (i + 1) + '</div>' +
        '<p class="text-gray-700 leading-relaxed pt-1">' + escapeHtml(text) + '</p>' +
        '</li>';
    }).join('');
  }

  var tipsList = document.getElementById('tips-list');
  if (tipsList && recipe.tips && recipe.tips.length > 0) {
    tipsList.innerHTML = recipe.tips.map(function(tip) {
      return '<li class="flex gap-2 py-1.5">' +
        '<span class="text-[#FFD100] flex-shrink-0 mt-0.5">\uD83D\uDCA1</span>' +
        '<span class="text-gray-700">' + escapeHtml(tip) + '</span>' +
        '</li>';
    }).join('');
    var tipsParent = tipsList.closest('[data-optional]');
    if (tipsParent) tipsParent.classList.remove('hidden');
  }

  var kwEl = document.getElementById('recipe-keywords');
  if (kwEl && recipe.keywords && recipe.keywords.length > 0) {
    kwEl.innerHTML = recipe.keywords.map(function(kw) {
      return '<a href="recipes.html?q=' + encodeURIComponent(kw) +
        '" class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-[#0033A0] hover:text-white transition-colors duration-200">' +
        escapeHtml(kw) + '</a>';
    }).join('');
    var kwParent = kwEl.closest('[data-optional]');
    if (kwParent) kwParent.classList.remove('hidden');
  }

  // Sustitutos internacionales
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
      '<h3 class="font-bold text-blue-800 text-sm mb-3 flex items-center gap-2">\u2708\uFE0F Ingredientes en el Extranjero</h3>' +
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

  // Ruta turística
  var tourEl = document.getElementById('tourism-card');
  if (tourEl && recipe.tourism_route) {
    tourEl.innerHTML = '<div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl p-5 backdrop-blur-sm">' +
      '<h3 class="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">\uD83D\uDDFA\uFE0F Ruta Gastron\u00f3mica 2026</h3>' +
      '<p class="text-amber-700 leading-relaxed text-sm">' + escapeHtml(recipe.tourism_route) + '</p>' +
    '</div>';
    tourEl.classList.remove('hidden');
  }

  // Secciones v3
  renderPlacesCard(recipe);
  renderVideosCard(recipe);
  renderImageCredit(recipe);
  renderFaqsSection(recipe);

  // ── Costo estimado ──────────────────────────────────────────
  var costRow = document.getElementById('estimated-cost-row');
  var costVal = document.getElementById('estimated-cost-value');
  if (costRow && costVal && recipe.estimated_cost) {
    costVal.textContent = recipe.estimated_cost;
    costRow.classList.remove('hidden');
  }

  // ── Pinterest button en hero ────────────────────────────────
  var pinterestBtn = document.getElementById('pinterest-btn');
  if (pinterestBtn) {
    var pinImgUrl = encodeURIComponent(recipe.image_url || '');
    var pinDesc = encodeURIComponent(recipe.title + ' — Ecuador a la Carta | ' + (recipe.description || ''));
    var pinPageUrl = encodeURIComponent('https://ecuadoralacarta.com/recipe.html?slug=' + (recipe.slug || ''));
    pinterestBtn.href = 'https://pinterest.com/pin/create/button/?url=' + pinPageUrl + '&media=' + pinImgUrl + '&description=' + pinDesc;
  }

  // ── Social share flotante ───────────────────────────────────
  var socialShare = document.getElementById('social-share');
  if (socialShare) {
    var pageUrl = encodeURIComponent('https://ecuadoralacarta.com/recipe.html?slug=' + (recipe.slug || ''));
    var shareText = encodeURIComponent('🍽️ ' + recipe.title + ' — Receta ecuatoriana auténtica | Ecuador a la Carta');
    var waShare = document.getElementById('share-whatsapp');
    var fbShare = document.getElementById('share-facebook');
    var xShare = document.getElementById('share-x');
    var pinShare = document.getElementById('share-pinterest');
    if (waShare) waShare.href = 'https://wa.me/?text=' + shareText + '%20' + pageUrl;
    if (fbShare) fbShare.href = 'https://www.facebook.com/sharer/sharer.php?u=' + pageUrl;
    if (xShare) xShare.href = 'https://x.com/intent/tweet?text=' + shareText + '&url=' + pageUrl;
    if (pinShare) pinShare.href = 'https://pinterest.com/pin/create/button/?url=' + pageUrl + '&media=' + encodeURIComponent(recipe.image_url || '') + '&description=' + shareText;
    socialShare.classList.remove('hidden');
  }

  // ── Toggle EN / ES ──────────────────────────────────────────
  if (recipe.en_translation) {
    var langWrap = document.getElementById('lang-toggle-wrap');
    var langBtn = document.getElementById('lang-toggle');
    var langFlag = document.getElementById('lang-flag');
    var langText = document.getElementById('lang-text');
    var titleEl = document.getElementById('recipe-title');
    var descEl = document.getElementById('recipe-description');
    if (langWrap && langBtn) {
      langWrap.classList.remove('hidden');
      var isEnglish = false;
      var esTitle = recipe.title;
      var esDesc = recipe.description || '';
      var enTitle = recipe.en_translation.title || recipe.title;
      var enDesc = recipe.en_translation.description || recipe.description || '';
      langBtn.addEventListener('click', function() {
        isEnglish = !isEnglish;
        if (titleEl) titleEl.textContent = isEnglish ? enTitle : esTitle;
        if (descEl) descEl.textContent = isEnglish ? enDesc : esDesc;
        if (langFlag) langFlag.textContent = isEnglish ? '🇪🇨' : '🇺🇸';
        if (langText) langText.textContent = isEnglish ? 'Ver en Español' : 'Ver en English';
        document.documentElement.lang = isEnglish ? 'en' : 'es';
      });
    }
  }

  initAds();
}

// ─── Blog: renderBlogCard ─────────────────────────────────────
function renderBlogCard(post) {
  var img = post.image_url
    ? escapeHtml(post.image_url)
    : 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80';
  var imgAlt = escapeHtml(post.image_alt || post.title);
  var categoryColors = {
    'Rutas': 'bg-green-100 text-green-700 border-green-200',
    'Destinos': 'bg-blue-100 text-blue-700 border-blue-200',
    'Cultura': 'bg-purple-100 text-purple-700 border-purple-200',
    'Festividades': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Naturaleza': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Aventura': 'bg-orange-100 text-orange-700 border-orange-200',
    'Gastronom\u00eda': 'bg-amber-100 text-amber-700 border-amber-200'
  };
  var catClass = categoryColors[post.category] || 'bg-gray-100 text-gray-600 border-gray-200';

  return '<article class="group relative bg-white rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 overflow-hidden cursor-pointer focus-within:ring-2 focus-within:ring-[#C8102E] focus-within:ring-offset-2">' +
    '<a href="post.html?slug=' + encodeURIComponent(post.slug) + '" class="block" aria-label="' + escapeHtml(post.title) + '">' +
      '<div class="relative h-52 overflow-hidden">' +
        '<img src="' + img + '" alt="' + imgAlt + '"' +
          ' class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"' +
          ' loading="lazy" onerror="this.src=\'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80\'">' +
        '<div class="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent"></div>' +
        (post.featured ? '<div class="absolute top-3 left-3"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFD700]/90 text-[#004d00] backdrop-blur-sm">⭐ Destacado</span></div>' : '') +
        (post.region ? '<div class="absolute bottom-3 left-3"><span class="text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">' + escapeHtml(post.region) + '</span></div>' : '') +
      '</div>' +
      '<div class="p-5">' +
        '<div class="flex flex-wrap gap-2 mb-2">' +
          (post.category ? '<span class="text-xs font-medium border px-2.5 py-0.5 rounded-full ' + catClass + '">' + escapeHtml(post.category) + '</span>' : '') +
          (post.reading_time ? '<span class="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full">\u23f1 ' + escapeHtml(post.reading_time) + '</span>' : '') +
        '</div>' +
        '<h3 class="font-bold text-gray-900 text-base leading-snug mb-1 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200">' + escapeHtml(post.title) + '</h3>' +
        '<p class="text-gray-500 text-sm line-clamp-2 mb-2">' + escapeHtml(post.description || '') + '</p>' +
        (post.date_published ? '<p class="text-xs text-gray-400">' + post.date_published + '</p>' : '') +
      '</div>' +
    '</a>' +
  '</article>';
}

// ─── Blog: injectPostSEO ──────────────────────────────────────
function injectPostSEO(post) {
  var canonicalUrl = 'https://ecuadoralacarta.com/post.html?slug=' + encodeURIComponent(post.slug);
  var imageUrl = post.image_url || '';
  var keywords = (post.keywords || []).concat(['turismo ecuador', 'viaje ecuador', 'destinos ecuador']).join(', ');

  setMeta(
    post.title + ' | Turismo Ecuador \uD83C\uDDEA\uD83C\uDDE8',
    post.description || post.title,
    imageUrl,
    canonicalUrl
  );
  upsertMeta('name', 'keywords', keywords);

  var article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': post.title,
    'description': post.description || '',
    'image': imageUrl,
    'author': { '@type': 'Organization', 'name': 'Ecuador a la Carta' },
    'publisher': {
      '@type': 'Organization',
      'name': 'Ecuador a la Carta',
      'logo': { '@type': 'ImageObject', 'url': 'https://ecuadoralacarta.com/favicon.ico' }
    },
    'datePublished': post.date_published || post.created_at || new Date().toISOString(),
    'dateModified': post.created_at || new Date().toISOString(),
    'keywords': keywords,
    'inLanguage': 'es',
    'about': { '@type': 'Country', 'name': 'Ecuador' }
  };

  var breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': 'https://ecuadoralacarta.com/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Blog Turismo', 'item': 'https://ecuadoralacarta.com/blog.html' },
      { '@type': 'ListItem', 'position': 3, 'name': post.title, 'item': canonicalUrl }
    ]
  };

  var schemas = [article, breadcrumb];

  if (post.faqs && post.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': post.faqs.map(function(faq) {
        return { '@type': 'Question', 'name': faq.q, 'acceptedAnswer': { '@type': 'Answer', 'text': faq.a } };
      })
    });
  }

  var ld = document.querySelector('script[type="application/ld+json"]');
  if (!ld) {
    ld = document.createElement('script');
    ld.type = 'application/ld+json';
    document.head.appendChild(ld);
  }
  ld.textContent = JSON.stringify(schemas);
}

// ─── Página: BLOG ─────────────────────────────────────────────
async function initBlog() {
  var posts = await loadPosts();
  var grid = document.getElementById('blog-grid');
  var resultsCount = document.getElementById('blog-results-count');
  var searchInput = document.getElementById('blog-search');
  var categorySel = document.getElementById('blog-category');
  var regionSel = document.getElementById('blog-region');
  var clearBtn = document.getElementById('blog-clear');

  // Poblar categorías
  if (categorySel) {
    var seenCats = {}, cats = [];
    posts.forEach(function(p) { if (p.category && !seenCats[p.category]) { seenCats[p.category] = 1; cats.push(p.category); } });
    cats.sort().forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      categorySel.appendChild(opt);
    });
  }
  if (regionSel) {
    var seenRegs = {}, regs = [];
    posts.forEach(function(p) { if (p.region && !seenRegs[p.region]) { seenRegs[p.region] = 1; regs.push(p.region); } });
    regs.sort().forEach(function(r) {
      var opt = document.createElement('option');
      opt.value = r; opt.textContent = r;
      regionSel.appendChild(opt);
    });
  }

  function applyBlogFilters() {
    var q = searchInput ? searchInput.value.toLowerCase().trim() : '';
    var cat = categorySel ? categorySel.value : '';
    var reg = regionSel ? regionSel.value : '';

    var filtered = posts.filter(function(p) {
      if (q) {
        var hay = (p.title + ' ' + (p.description || '') + ' ' + (p.keywords || []).join(' ')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      if (cat && p.category !== cat) return false;
      if (reg && p.region !== reg) return false;
      return true;
    });

    if (resultsCount) {
      resultsCount.textContent = filtered.length === 1 ? '1 artículo' : filtered.length + ' artículos';
    }

    if (!grid) return;
    if (filtered.length === 0) {
      if (posts.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-400">' +
          '<div class="text-6xl mb-4">📰</div>' +
          '<p class="text-lg font-medium text-gray-500">El blog de turismo se está preparando</p>' +
          '<p class="text-sm mt-1">En breve publicaremos nuestros primeros artículos sobre destinos y cultura ecuatoriana.</p>' +
          '</div>';
      } else {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">' +
          '<p class="text-lg font-medium">Sin artículos con esos filtros</p>' +
          '</div>';
      }
      return;
    }
    grid.innerHTML = filtered.map(renderBlogCard).join('');
  }

  var params = new URLSearchParams(window.location.search);
  if (searchInput && params.get('q')) searchInput.value = params.get('q');
  if (categorySel && params.get('category')) categorySel.value = params.get('category');
  if (regionSel && params.get('region')) regionSel.value = params.get('region');

  if (searchInput) searchInput.addEventListener('input', debounce(applyBlogFilters, 300));
  if (categorySel) categorySel.addEventListener('change', applyBlogFilters);
  if (regionSel) regionSel.addEventListener('change', applyBlogFilters);
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (searchInput) searchInput.value = '';
      if (categorySel) categorySel.value = '';
      if (regionSel) regionSel.value = '';
      applyBlogFilters();
    });
  }

  if (grid) grid.innerHTML = renderSkeleton(3);
  applyBlogFilters();
}

// ─── Página: POST ─────────────────────────────────────────────
async function initPost() {
  var params = new URLSearchParams(window.location.search);
  var slug = params.get('slug');
  var loadingEl = document.getElementById('post-loading');
  var errorEl = document.getElementById('post-error');
  var contentEl = document.getElementById('post-content');

  if (!slug) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
    return;
  }

  var posts = await loadPosts();
  var post = null;
  for (var i = 0; i < posts.length; i++) {
    if (posts[i].slug === slug) { post = posts[i]; break; }
  }

  if (loadingEl) loadingEl.classList.add('hidden');

  if (!post) {
    if (errorEl) {
      errorEl.classList.remove('hidden');
      var msgEl = errorEl.querySelector('[data-error-msg]');
      if (msgEl) msgEl.textContent = 'No encontramos el artículo "' + escapeHtml(slug) + '".';
    }
    return;
  }

  if (contentEl) contentEl.classList.remove('hidden');

  injectPostSEO(post);

  // Breadcrumb
  var bcPost = document.getElementById('bc-post');
  if (bcPost) bcPost.textContent = post.title;

  // Hero imagen
  var heroImg = document.getElementById('post-hero-img');
  if (heroImg) {
    heroImg.src = post.image_url || 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=80';
    heroImg.alt = post.image_alt || post.title;
    heroImg.onerror = function() { this.src = 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=80'; };
  }

  // Meta fields
  var tf = [
    ['post-title', post.title],
    ['post-subtitle', post.subtitle],
    ['post-description-text', post.description],
    ['post-category', post.category],
    ['post-region', post.region],
    ['post-reading-time', post.reading_time],
    ['post-date', post.date_published],
    ['post-source', post.source]
  ];
  tf.forEach(function(pair) {
    var el = document.getElementById(pair[0]);
    if (el && pair[1]) {
      el.textContent = pair[1];
      var parent = el.closest('[data-optional]');
      if (parent) parent.classList.remove('hidden');
    }
  });

  // Contenido HTML
  var contentBody = document.getElementById('post-content-body');
  if (contentBody && post.content) {
    contentBody.innerHTML = post.content;
  }

  // FAQs accordion
  var faqsEl = document.getElementById('post-faqs');
  if (faqsEl && post.faqs && post.faqs.length > 0) {
    faqsEl.innerHTML = '<div class="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden mt-6">' +
      '<div class="bg-gradient-to-r from-[#0033A0] to-[#001f6e] px-5 py-4">' +
        '<h2 class="text-white font-bold text-base">❓ Preguntas Frecuentes</h2>' +
      '</div>' +
      '<div class="divide-y divide-gray-100">' +
      post.faqs.map(function(faq) {
        return '<details class="group px-5 py-4 cursor-pointer">' +
          '<summary class="font-semibold text-gray-800 text-sm list-none flex items-center justify-between gap-2">' +
            '<span>' + escapeHtml(faq.q) + '</span>' +
            '<span class="text-[#0033A0] font-bold text-lg flex-shrink-0">+</span>' +
          '</summary>' +
          '<p class="text-gray-600 text-sm mt-2 leading-relaxed">' + escapeHtml(faq.a) + '</p>' +
        '</details>';
      }).join('') +
      '</div></div>';
    faqsEl.classList.remove('hidden');
  }

  // Related recipes (same region)
  var relatedEl = document.getElementById('post-related-recipes');
  if (relatedEl && post.region) {
    var recipes = await loadRecipes();
    var related = recipes.filter(function(r) { return r.region === post.region; }).slice(0, 3);
    if (related.length > 0) {
      relatedEl.innerHTML = '<div class="mt-8">' +
        '<h3 class="font-bold text-gray-800 text-base mb-4">🍽️ Recetas de ' + escapeHtml(post.region) + '</h3>' +
        '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">' +
        related.map(renderCard).join('') +
        '</div></div>';
      relatedEl.classList.remove('hidden');
    }
  }

  initAds();
}

// ─── Blog preview en index ─────────────────────────────────────
async function loadBlogPreview() {
  var grid = document.getElementById('blog-preview-grid');
  if (!grid) return;
  var posts = await loadPosts();
  if (posts.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">' +
      '<p class="font-medium">Próximamente: artículos de turismo</p></div>';
    return;
  }
  grid.innerHTML = posts.slice(0, 3).map(renderBlogCard).join('');
}

// ─── renderIngredient (ticket-style con badges de tienda) ────
function renderIngredient(ing) {
  var STORES = ['supermaxi', 'megamaxi', 'tuti', 'tia', 'santa mar\u00eda', 'coral'];
  var lowerIng = String(ing).toLowerCase();
  var badge = '';
  if (lowerIng.indexOf('supermaxi') !== -1 || lowerIng.indexOf('megamaxi') !== -1) {
    badge = '<span class="ml-auto text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Supermaxi</span>';
  } else if (lowerIng.indexOf('tuti') !== -1) {
    badge = '<span class="ml-auto text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Tuti</span>';
  } else if (lowerIng.indexOf('tia') !== -1 || lowerIng.indexOf('t\u00eda') !== -1) {
    badge = '<span class="ml-auto text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full flex-shrink-0">TIA</span>';
  }
  return '<li class="flex items-start gap-2 py-2 border-b border-dashed border-gray-100 last:border-0">' +
    '<span class="text-[#0033A0] mt-0.5 flex-shrink-0 font-bold">\u2713</span>' +
    '<span class="text-gray-700 font-mono text-sm flex-1">' + escapeHtml(ing) + '</span>' +
    badge +
    '</li>';
}

// ─── Página: MENÚ SEMANAL ─────────────────────────────────────
async function initMenuSemanal() {
  var recipes = await loadRecipes();
  var grid = document.getElementById('menu-grid');
  var regenBtn = document.getElementById('menu-regen');
  if (!grid) return;

  var DAYS = ['Lunes', 'Martes', 'Mi\u00e9rcoles', 'Jueves', 'Viernes', 'S\u00e1bado', 'Domingo'];
  var DAY_EMOJIS = ['\uD83C\uDF31', '\uD83C\uDF72', '\uD83C\uDF5B', '\uD83C\uDF7D\uFE0F', '\uD83E\uDD57', '\uD83C\uDF89', '\u2728'];

  function pickMenu() {
    var mains = recipes.filter(function(r) {
      return !r.category || ['Platos Fuertes', 'Sopas', 'Mariscos', 'Desayunos', 'Entradas'].indexOf(r.category) !== -1;
    });
    var desserts = recipes.filter(function(r) { return r.category === 'Postres'; });
    var shuffled = mains.slice().sort(function() { return Math.random() - 0.5; });
    var dessertShuffled = desserts.slice().sort(function() { return Math.random() - 0.5; });

    var result = [];
    for (var i = 0; i < 7; i++) {
      if ((i === 5 || i === 6) && dessertShuffled.length > 0) {
        // Sábado y domingo: postre si hay
        result.push(dessertShuffled.shift() || shuffled[i % shuffled.length] || null);
      } else {
        result.push(shuffled[i % shuffled.length] || null);
      }
    }
    return result;
  }

  function renderMenu() {
    var menu = pickMenu();
    if (recipes.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center py-16 text-gray-400">' +
        '<div class="text-5xl mb-4">\uD83D\uDCC5</div>' +
        '<p class="text-lg font-medium">Pronto publicaremos el men\u00fa semanal</p>' +
        '</div>';
      return;
    }
    grid.innerHTML = DAYS.map(function(day, i) {
      var r = menu[i];
      if (!r) return '<div class="bg-white rounded-3xl shadow-md p-5 text-center text-gray-400 border border-gray-100">' +
        '<p class="font-bold">' + DAY_EMOJIS[i] + ' ' + day + '</p>' +
        '<p class="text-sm mt-2">Sin receta</p></div>';
      var img = r.image_url || 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=70';
      return '<a href="recipe.html?slug=' + encodeURIComponent(r.slug) + '"' +
        ' class="group bg-white rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 overflow-hidden block">' +
        '<div class="relative h-36 overflow-hidden">' +
          '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(r.title) + '"' +
            ' class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy">' +
          '<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>' +
          '<div class="absolute top-3 left-3 bg-[#0033A0] text-white text-xs font-bold px-2.5 py-1 rounded-full">' +
            DAY_EMOJIS[i] + ' ' + day +
          '</div>' +
        '</div>' +
        '<div class="p-4">' +
          '<p class="font-bold text-gray-900 text-sm leading-snug group-hover:text-[#0033A0] transition-colors">' + escapeHtml(r.title) + '</p>' +
          (r.total_time ? '<p class="text-xs text-gray-400 mt-1">\u23f1 ' + escapeHtml(r.total_time) + '</p>' : '') +
          (r.region ? '<p class="text-xs text-[#0033A0] mt-1 font-medium">' + escapeHtml(r.region) + '</p>' : '') +
        '</div>' +
      '</a>';
    }).join('');
    initAds();
  }

  renderMenu();
  if (regenBtn) {
    regenBtn.addEventListener('click', function() {
      grid.innerHTML = renderSkeleton(7);
      setTimeout(renderMenu, 300);
    });
  }
}

// ─── Router ───────────────────────────────────────────────────
(function router() {
  var path = window.location.pathname.split('/').pop() || 'index.html';
  if (path === 'index.html' || path === '' || path === '/') {
    initIndex();
    loadBlogPreview();
  } else if (path === 'recipes.html') {
    initListing();
  } else if (path === 'recipe.html') {
    initRecipe();
  } else if (path === 'blog.html') {
    initBlog();
  } else if (path === 'post.html') {
    initPost();
  } else if (path === 'menu-semanal.html') {
    initMenuSemanal();
  }
})();
