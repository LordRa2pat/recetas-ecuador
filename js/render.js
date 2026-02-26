// Ecuador a la Carta — js/render.js
// Funciones de renderizado: cards, skeletons, grids, blog cards, FAQs

"use strict";

import { escapeHtml } from "./utils.js";
import { renderInFeedAd } from "./ads.js";

// ─── Audience chip ────────────────────────────────────────────
export function getAudienceChip(recipe) {
  var isDiaspora =
    recipe.target_audience === "Di\u00e1spora" ||
    (recipe.international_substitutes &&
      recipe.international_substitutes.length > 0);
  var isTourism =
    recipe.target_audience === "Turista" ||
    !!recipe.tourism_route ||
    (recipe.places && recipe.places.length > 0);
  if (isDiaspora) {
    return (
      '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-700 backdrop-blur-sm border border-blue-200/60">' +
      "\u2708\uFE0F Di\u00e1spora</span>"
    );
  }
  if (isTourism) {
    return (
      '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-700 backdrop-blur-sm border border-amber-200/60">' +
      "\uD83D\uDDFA\uFE0F Turismo</span>"
    );
  }
  return "";
}

// ─── Skeleton ────────────────────────────────────────────────
export function renderSkeleton(count) {
  count = count || 3;
  var html = "";
  for (var i = 0; i < count; i++) {
    html +=
      '<div class="bg-white rounded-3xl shadow-md overflow-hidden animate-pulse" aria-hidden="true">' +
      '<div class="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 h-52"></div>' +
      '<div class="p-5">' +
      '<div class="flex gap-2 mb-3">' +
      '<div class="bg-gray-200 h-5 w-16 rounded-full"></div>' +
      '<div class="bg-gray-200 h-4 w-12 rounded-full"></div>' +
      "</div>" +
      '<div class="bg-gray-200 h-4 rounded-full mb-2.5 w-full"></div>' +
      '<div class="bg-gray-200 h-4 rounded-full mb-4 w-4/5"></div>' +
      '<div class="flex gap-3 pt-3 border-t border-gray-100">' +
      '<div class="bg-gray-200 h-3 w-16 rounded-full"></div>' +
      '<div class="bg-gray-200 h-3 w-12 rounded-full"></div>' +
      "</div>" +
      "</div>" +
      "</div>";
  }
  return html;
}

// ─── Card ─────────────────────────────────────────────────────
export function renderCard(recipe) {
  var chip = getAudienceChip(recipe);
  var hasTourism =
    !!recipe.tourism_route || (recipe.places && recipe.places.length > 0);
  var hasVideos = !!(recipe.youtube_videos && recipe.youtube_videos.length > 0);
  var img = recipe.image_url
    ? escapeHtml(recipe.image_url)
    : "https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80";
  var imgAlt = escapeHtml(recipe.image_alt || recipe.title);

  return (
    '<article class="group relative bg-white rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 overflow-hidden cursor-pointer focus-within:ring-2 focus-within:ring-[#0033A0] focus-within:ring-offset-2">' +
    '<a href="recipe.html?slug=' +
    encodeURIComponent(recipe.slug) +
    '" class="block" aria-label="' +
    escapeHtml(recipe.title) +
    '"' +
    ' data-track-type="recipe" data-track-slug="' +
    escapeHtml(recipe.slug) +
    '" data-track-title="' +
    escapeHtml(recipe.title) +
    '" data-track-region="' +
    escapeHtml(recipe.region || "") +
    '" data-track-category="' +
    escapeHtml(recipe.category || "") +
    '">' +
    '<div class="relative h-52 overflow-hidden">' +
    '<img src="' +
    img +
    '" alt="' +
    imgAlt +
    '"' +
    ' class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"' +
    ' loading="lazy" onerror="this.src=\'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80\'">' +
    '<div class="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>' +
    (chip ? '<div class="absolute top-3 left-3">' + chip + "</div>" : "") +
    '<div class="absolute bottom-3 right-3 flex gap-1.5">' +
    (hasTourism
      ? '<span class="text-white text-base drop-shadow-md" title="Ruta Gastron\u00f3mica">\uD83D\uDDFA\uFE0F</span>'
      : "") +
    (hasVideos
      ? '<span class="text-white text-base drop-shadow-md" title="Video tutorial">\u25B6\uFE0F</span>'
      : "") +
    "</div>" +
    "</div>" +
    '<div class="p-5">' +
    '<div class="flex flex-wrap gap-2 mb-2">' +
    (recipe.region
      ? '<span class="text-xs font-medium text-[#0033A0] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">' +
      escapeHtml(recipe.region) +
      "</span>"
      : "") +
    (recipe.difficulty
      ? '<span class="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full">' +
      escapeHtml(recipe.difficulty) +
      "</span>"
      : "") +
    "</div>" +
    '<h3 class="font-bold text-gray-900 text-base leading-snug mb-1 clamp-2 group-hover:text-[#0033A0] transition-colors duration-200">' +
    escapeHtml(recipe.title) +
    "</h3>" +
    '<p class="text-gray-500 text-sm clamp-2 mb-3">' +
    escapeHtml(recipe.description || "") +
    "</p>" +
    '<div class="flex items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-400">' +
    (recipe.total_time
      ? "<span>\u23f1 " + escapeHtml(recipe.total_time) + "</span>"
      : "") +
    (recipe.servings
      ? "<span>\uD83D\uDC65 " + escapeHtml(recipe.servings) + "</span>"
      : "") +
    (recipe.category
      ? '<span class="ml-auto text-[#FFD100] font-bold">' +
      escapeHtml(recipe.category) +
      "</span>"
      : "") +
    "</div>" +
    "</div>" +
    "</a>" +
    "</article>"
  );
}

// ─── Places Card ─────────────────────────────────────────────
export function renderPlacesCard(recipe) {
  var el = document.getElementById("places-card");
  if (!el || !recipe.places || recipe.places.length === 0) return;

  var places = recipe.places;
  var firstPlace = places[0];
  var mapEmbed = "";

  if (firstPlace.lat && firstPlace.lng) {
    mapEmbed =
      '<div class="rounded-2xl overflow-hidden mb-4 border border-amber-200/40" style="height:200px">' +
      '<iframe src="https://www.google.com/maps?q=' +
      encodeURIComponent(firstPlace.lat + "," + firstPlace.lng) +
      '&z=14&output=embed"' +
      ' width="100%" height="200" style="border:0;" allowfullscreen="" loading="lazy"' +
      ' referrerpolicy="strict-origin-when-cross-origin"' +
      ' title="Ubicaci\u00f3n de ' +
      escapeHtml(firstPlace.name) +
      '"></iframe>' +
      "</div>";
  }

  var placesHTML = places
    .map(function (place) {
      var mapsUrl =
        place.googleMapsUri ||
        (place.place_id
          ? "https://www.google.com/maps/place/?q=place_id:" +
          encodeURIComponent(place.place_id)
          : "") ||
        (place.lat && place.lng
          ? "https://www.google.com/maps?q=" + place.lat + "," + place.lng
          : "") ||
        "https://www.google.com/maps/search/" +
        encodeURIComponent(
          (place.name || "") + " " + (place.city || "") + " Ecuador",
        );

      var starsHTML = "";
      if (place.rating) {
        starsHTML =
          '<span class="text-amber-400 text-xs">\u2605 ' +
          parseFloat(place.rating).toFixed(1) +
          "</span>" +
          (place.userRatingCount
            ? '<span class="text-gray-400 text-xs ml-1">(' +
            place.userRatingCount +
            ")</span>"
            : "");
      }

      return (
        '<div class="flex items-start gap-3 py-3 border-b border-amber-100/60 last:border-0">' +
        '<div class="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">\uD83D\uDCCD</div>' +
        '<div class="flex-1 min-w-0">' +
        '<p class="font-semibold text-gray-800 text-sm leading-tight">' +
        escapeHtml(place.name || "") +
        "</p>" +
        '<p class="text-amber-700 text-xs mt-0.5">' +
        escapeHtml(place.city || place.region || "") +
        "</p>" +
        (starsHTML
          ? '<div class="flex items-center gap-1 mt-0.5">' +
          starsHTML +
          "</div>"
          : "") +
        "</div>" +
        '<a href="' +
        escapeHtml(mapsUrl) +
        '" target="_blank" rel="noopener noreferrer"' +
        ' class="flex-shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-xl hover:bg-amber-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"' +
        ' aria-label="Ver ' +
        escapeHtml(place.name || "") +
        ' en Google Maps">' +
        "Ver mapa \u2192" +
        "</a>" +
        "</div>"
      );
    })
    .join("");

  el.innerHTML =
    '<div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl p-5 backdrop-blur-sm">' +
    '<h3 class="font-bold text-amber-800 text-sm mb-1 flex items-center gap-2">\uD83D\uDCCD D\u00f3nde comerlo en Ecuador</h3>' +
    '<p class="text-amber-600 text-xs mb-4">Restaurantes y mercados locales donde probar este plato.</p>' +
    mapEmbed +
    "<div>" +
    placesHTML +
    "</div>" +
    "</div>";
  el.classList.remove("hidden");
}

// ─── Videos Card ─────────────────────────────────────────────
export function renderVideosCard(recipe) {
  var el = document.getElementById("videos-card");
  if (!el || !recipe.youtube_videos || recipe.youtube_videos.length === 0)
    return;

  var videos = recipe.youtube_videos.slice(0, 3);
  var videosHTML = videos
    .map(function (video, i) {
      if (!video.videoId) return "";
      var embedUrl =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(video.videoId) +
        "?rel=0&modestbranding=1";
      return (
        "<div" +
        (i > 0 ? ' class="mt-4"' : "") +
        ">" +
        '<div class="relative rounded-2xl overflow-hidden bg-black" style="padding-bottom:56.25%;height:0">' +
        '<iframe src="' +
        embedUrl +
        '"' +
        ' title="' +
        escapeHtml(video.title || recipe.title) +
        '"' +
        ' style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"' +
        ' loading="lazy" referrerpolicy="strict-origin-when-cross-origin"' +
        ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"' +
        " allowfullscreen></iframe>" +
        "</div>" +
        (video.title
          ? '<p class="text-xs text-gray-500 mt-2 font-medium">' +
          escapeHtml(video.title) +
          "</p>"
          : "") +
        (video.channel
          ? '<p class="text-xs text-gray-400">' +
          escapeHtml(video.channel) +
          "</p>"
          : "") +
        "</div>"
      );
    })
    .join("");

  if (!videosHTML.trim()) return;

  el.innerHTML =
    '<div class="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/60 rounded-3xl p-5 backdrop-blur-sm">' +
    '<h3 class="font-bold text-red-800 text-sm mb-1 flex items-center gap-2">\u25B6\uFE0F Tutoriales en YouTube</h3>' +
    '<p class="text-red-600 text-xs mb-4">Aprende a preparar este plato con estos videos.</p>' +
    videosHTML +
    "</div>";
  el.classList.remove("hidden");
}

// ─── Image Credit ─────────────────────────────────────────────
export function renderImageCredit(recipe) {
  var el = document.getElementById("image-credit");
  if (!el || !recipe.image_credit) return;

  var c = recipe.image_credit;
  var parts = ["Cr\u00e9dito de imagen"];
  if (c.author) parts.push(": " + escapeHtml(c.author));
  if (c.source) parts.push(" v\u00eda " + escapeHtml(c.source));
  if (c.license) parts.push(" \u2014 " + escapeHtml(c.license));
  var text = parts.join("");

  el.innerHTML = c.url
    ? '<a href="' +
    escapeHtml(c.url) +
    '" target="_blank" rel="noopener noreferrer"' +
    ' class="text-xs text-gray-400 hover:text-gray-600 transition-colors">' +
    text +
    " \uD83D\uDD17</a>"
    : '<span class="text-xs text-gray-400">' + text + "</span>";
  el.classList.remove("hidden");
}

// ─── Estado vacío ─────────────────────────────────────────────
export function renderEmptyState(containerEl, msg) {
  msg = msg || "No hay recetas disponibles a\u00fan.";
  containerEl.innerHTML =
    '<div class="col-span-full flex flex-col items-center justify-center py-16 text-center text-gray-400">' +
    '<div class="text-5xl mb-4">\uD83C\uDF7D\uFE0F</div>' +
    '<p class="text-lg font-medium text-gray-500">' +
    escapeHtml(msg) +
    "</p>" +
    '<p class="text-sm mt-1">Pronto agregaremos nuevas recetas.</p>' +
    "</div>";
}

// ─── Grid con ads ─────────────────────────────────────────────
export function renderGridWithAds(recipes, gridEl, adsInterval) {
  adsInterval = adsInterval || 9;
  if (!gridEl) return;
  if (recipes.length === 0) {
    renderEmptyState(gridEl, "Sin recetas con esos filtros.");
    return;
  }
  var html = "";
  var adsInserted = 0;
  for (var i = 0; i < recipes.length; i++) {
    html += renderCard(recipes[i]);
    if (
      (i + 1) % adsInterval === 0 &&
      adsInserted < 3 &&
      i < recipes.length - 1
    ) {
      html += renderInFeedAd("2222222222");
      adsInserted++;
    }
  }
  gridEl.innerHTML = html;
}

// ─── Blog Card ─────────────────────────────────────────────
export function renderBlogCard(post) {
  var img = post.image_url
    ? escapeHtml(post.image_url)
    : "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80";
  var imgAlt = escapeHtml(post.image_alt || post.title);
  var categoryColors = {
    Rutas: "bg-green-100 text-green-700 border-green-200",
    Destinos: "bg-blue-100 text-blue-700 border-blue-200",
    Cultura: "bg-purple-100 text-purple-700 border-purple-200",
    Festividades: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Naturaleza: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Aventura: "bg-orange-100 text-orange-700 border-orange-200",
    "Gastronom\u00eda": "bg-amber-100 text-amber-700 border-amber-200",
  };
  var catClass =
    categoryColors[post.category] ||
    "bg-gray-100 text-gray-600 border-gray-200";

  return (
    '<article class="group relative bg-white rounded-3xl shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 overflow-hidden cursor-pointer focus-within:ring-2 focus-within:ring-[#C8102E] focus-within:ring-offset-2">' +
    '<a href="post.html?slug=' +
    encodeURIComponent(post.slug) +
    '" class="block" aria-label="' +
    escapeHtml(post.title) +
    '"' +
    ' data-track-type="post" data-track-slug="' +
    escapeHtml(post.slug) +
    '" data-track-title="' +
    escapeHtml(post.title) +
    '" data-track-category="' +
    escapeHtml(post.category || "") +
    '">' +
    '<div class="relative h-52 overflow-hidden">' +
    '<img src="' +
    img +
    '" alt="' +
    imgAlt +
    '"' +
    ' class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"' +
    ' loading="lazy" onerror="this.src=\'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80\'">' +
    '<div class="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent"></div>' +
    (post.featured
      ? '<div class="absolute top-3 left-3"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFD700]/90 text-[#004d00] backdrop-blur-sm">\u2B50 Destacado</span></div>'
      : "") +
    (post.region
      ? '<div class="absolute bottom-3 left-3"><span class="text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">' +
      escapeHtml(post.region) +
      "</span></div>"
      : "") +
    "</div>" +
    '<div class="p-5">' +
    '<div class="flex flex-wrap gap-2 mb-2">' +
    (post.category
      ? '<span class="text-xs font-medium border px-2.5 py-0.5 rounded-full ' +
      catClass +
      '">' +
      escapeHtml(post.category) +
      "</span>"
      : "") +
    (post.reading_time
      ? '<span class="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full">\u23f1 ' +
      escapeHtml(post.reading_time) +
      "</span>"
      : "") +
    "</div>" +
    '<h3 class="font-bold text-gray-900 text-base leading-snug mb-1 line-clamp-2 group-hover:text-[#C8102E] transition-colors duration-200">' +
    escapeHtml(post.title) +
    "</h3>" +
    '<p class="text-gray-500 text-sm line-clamp-2 mb-2">' +
    escapeHtml(post.description || "") +
    "</p>" +
    (post.date_published
      ? '<p class="text-xs text-gray-400">' + post.date_published + "</p>"
      : "") +
    "</div>" +
    "</a>" +
    "</article>"
  );
}

// ─── FAQs de receta ───────────────────────────────────────────
export function renderFaqsSection(recipe) {
  var el = document.getElementById("faqs-section");
  if (!el || !recipe.faqs || recipe.faqs.length === 0) return;
  el.innerHTML =
    '<div class="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">' +
    '<div class="bg-gradient-to-r from-[#0033A0] to-[#001f6e] px-5 py-4">' +
    '<h2 class="text-white font-bold text-base flex items-center gap-2">\u2753 Preguntas Frecuentes</h2>' +
    "</div>" +
    '<div class="divide-y divide-gray-100">' +
    recipe.faqs
      .map(function (faq) {
        var q = faq.q || faq.question || '';
        var a = faq.a || faq.answer || '';
        return (
          '<details class="group px-5 py-4 cursor-pointer">' +
          '<summary class="font-semibold text-gray-800 text-sm list-none flex items-center justify-between gap-2">' +
          "<span>" +
          escapeHtml(q) +
          "</span>" +
          '<span class="text-[#0033A0] font-bold text-lg group-open:rotate-45 transition-transform duration-200 flex-shrink-0">+</span>' +
          "</summary>" +
          '<p class="text-gray-600 text-sm mt-2 leading-relaxed">' +
          escapeHtml(a) +
          "</p>" +
          "</details>"
        );
      })
      .join("") +
    "</div></div>";
  el.classList.remove("hidden");
}
