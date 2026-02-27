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
      '<div class="bg-white rounded-[40px] shadow-sm overflow-hidden animate-pulse border border-black/5" aria-hidden="true">' +
      '<div class="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 h-64"></div>' +
      '<div class="p-8">' +
      '<div class="flex gap-2 mb-4">' +
      '<div class="bg-gray-100 h-5 w-20 rounded-full"></div>' +
      "</div>" +
      '<div class="bg-gray-100 h-6 rounded-full mb-3 w-full"></div>' +
      '<div class="bg-gray-100 h-6 rounded-full mb-6 w-2/3"></div>' +
      '<div class="flex gap-4 pt-6 border-t border-gray-50">' +
      '<div class="bg-gray-100 h-3 w-16 rounded-full"></div>' +
      '<div class="bg-gray-100 h-3 w-16 rounded-full"></div>' +
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
  var img = recipe.image_url && recipe.image_url.trim() !== ""
    ? escapeHtml(recipe.image_url)
    : "images/default-recipe.jpg";
  var imgAlt = escapeHtml(recipe.image_alt || recipe.title);

  return (
    '<article class="group relative bg-white rounded-[40px] shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden cursor-pointer border border-black/5 ec-card-premium">' +
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
    '<div class="relative h-64 overflow-hidden">' +
    '<img src="' +
    img +
    '" alt="' +
    imgAlt +
    '"' +
    ' class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"' +
    ' loading="lazy" onerror="this.src=\'images/default-recipe.jpg\'">' +
    '<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>' +
    (chip ? '<div class="absolute top-6 left-6">' + chip + "</div>" : "") +
    '<div class="absolute bottom-6 right-6 flex gap-2">' +
    (hasTourism
      ? '<span class="w-8 h-8 rounded-full glass flex items-center justify-center text-sm shadow-lg" title="Ruta Gastron\u00f3mica">\uD83D\uDDFA\uFE0F</span>'
      : "") +
    (hasVideos
      ? '<span class="w-8 h-8 rounded-full glass flex items-center justify-center text-sm shadow-lg" title="Video tutorial">\u25B6\uFE0F</span>'
      : "") +
    "</div>" +
    "</div>" +
    '<div class="p-8">' +
    '<div class="flex items-center gap-3 mb-4">' +
    (recipe.region
      ? '<span class="text-[10px] font-bold text-ec-gold uppercase tracking-[0.2em]">' +
      escapeHtml(recipe.region) +
      "</span>"
      : "") +
    '<span class="w-1 h-1 rounded-full bg-gray-200"></span>' +
    (recipe.difficulty
      ? '<span class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">' +
      escapeHtml(recipe.difficulty) +
      "</span>"
      : "") +
    "</div>" +
    '<h3 class="font-serif italic text-2xl text-ec-blue leading-tight mb-3 group-hover:text-ec-gold transition-colors duration-500">' +
    escapeHtml(recipe.title) +
    "</h3>" +
    '<p class="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-8 font-light">' +
    escapeHtml(recipe.description || "") +
    "</p>" +
    '<div class="flex items-center justify-between pt-6 border-t border-gray-50">' +
    '<div class="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">' +
    (recipe.total_time
      ? '<span class="flex items-center gap-1.5"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' + escapeHtml(recipe.total_time) + "</span>"
      : "") +
    (recipe.servings
      ? '<span class="flex items-center gap-1.5"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>' + escapeHtml(recipe.servings) + "</span>"
      : "") +
    "</div>" +
    (recipe.category
      ? '<span class="text-ec-gold font-display font-black text-xs uppercase italic">' +
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
  var img = post.image_url && post.image_url.trim() !== ""
    ? escapeHtml(post.image_url)
    : "images/default-turismo.jpg";
  var imgAlt = escapeHtml(post.image_alt || post.title);

  return (
    '<article class="group relative bg-white rounded-[40px] shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden cursor-pointer border border-black/5 ec-card-premium">' +
    '<a href="post?slug=' +
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
    '<div class="relative h-64 overflow-hidden">' +
    '<img src="' +
    img +
    '" alt="' +
    imgAlt +
    '"' +
    ' class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"' +
    ' loading="lazy" onerror="this.src=\'images/default-turismo.jpg\'">' +
    '<div class="absolute inset-0 bg-gradient-to-t from-[#9A1B22]/60 via-transparent to-transparent opacity-60"></div>' +
    (post.featured
      ? '<div class="absolute top-6 left-6"><span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#FFD700] text-[#004d00] shadow-lg">\u2B50 DESTACADO</span></div>'
      : "") +
    '</div>' +
    '<div class="p-8">' +
    '<div class="flex items-center gap-3 mb-4">' +
    (post.category
      ? '<span class="text-[10px] font-bold text-ec-red uppercase tracking-[0.2em]">' +
      escapeHtml(post.category) +
      "</span>"
      : "") +
    '<span class="w-1 h-1 rounded-full bg-gray-200"></span>' +
    (post.reading_time
      ? '<span class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">\u23f1 ' +
      escapeHtml(post.reading_time) +
      "</span>"
      : "") +
    "</div>" +
    '<h3 class="font-serif italic text-2xl text-ec-blue leading-tight mb-3 group-hover:text-ec-red transition-colors duration-500">' +
    escapeHtml(post.title) +
    "</h3>" +
    '<p class="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-8 font-light">' +
    escapeHtml(post.description || "") +
    "</p>" +
    '<div class="flex items-center justify-between pt-6 border-t border-gray-50">' +
    (post.date_published
      ? '<span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest">' + post.date_published + "</span>"
      : "") +
    '<span class="text-ec-red font-display font-black text-xs uppercase italic">Leer cr\u00f3nica \u2192</span>' +
    "</div>" +
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
