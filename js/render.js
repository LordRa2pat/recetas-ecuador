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
      '<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-ec-gold text-[#0B1221] shadow-xl border border-white/20">' +
      "Di\u00e1spora</span>"
    );
  }
  if (isTourism) {
    return (
      '<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white text-[#0B1221] shadow-xl border border-white/20">' +
      "Explora</span>"
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
      '<div class="rounded-[48px] overflow-hidden bg-white/5 border border-white/5 animate-pulse" aria-hidden="true">' +
      '<div class="bg-gradient-to-r from-white/5 via-white/10 to-white/5 h-64"></div>' +
      '<div class="p-8">' +
      '<div class="h-2 w-1/4 bg-white/10 rounded-full mb-6"></div>' +
      '<div class="h-8 w-full bg-white/10 rounded-2xl mb-4"></div>' +
      '<div class="h-4 w-2/3 bg-white/5 rounded-2xl"></div>' +
      "</div>" +
      "</div>";
  }
  return html;
}

// ─── Card ─────────────────────────────────────────────────────
export function renderCard(recipe) {
  var chip = getAudienceChip(recipe);

  // YouTube Thumbnail Engine (Auto-Visuals)
  var img = "";
  if (recipe.image_url && recipe.image_url.trim() !== "") {
    img = escapeHtml(recipe.image_url);
  } else if (recipe.youtube_videos && recipe.youtube_videos.length > 0) {
    // Buscar primer video que no sea de canal KIWA si es posible
    var validVideo = recipe.youtube_videos.find(v => {
      const ch = (v.channel || "").toUpperCase();
      return ch !== "KIWA" && ch !== "KWA";
    }) || recipe.youtube_videos[0];

    if (validVideo && validVideo.videoId) {
      img = "https://img.youtube.com/vi/" + validVideo.videoId + "/maxresdefault.jpg";
    }
  }

  if (!img) img = "images/default-recipe.jpg";
  var imgAlt = escapeHtml(recipe.image_alt || recipe.title);

  return (
    '<article class="group relative rounded-[48px] overflow-hidden glass-card transition-all duration-700 hover:-translate-y-2">' +
    '<a href="recipe.html?slug=' + encodeURIComponent(recipe.slug) + '" class="block" aria-label="' + escapeHtml(recipe.title) + '">' +
    '<div class="relative h-72 overflow-hidden">' +
    '<img src="' + img + '" alt="' + imgAlt + '" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110">' +
    '<div class="absolute inset-0 bg-gradient-to-t from-[#0B1221] via-transparent to-transparent opacity-80"></div>' +
    (chip ? '<div class="absolute top-8 left-8 z-10">' + chip + "</div>" : "") +
    "</div>" +
    '<div class="p-10 flex flex-col flex-1">' +
    '<div class="flex items-center gap-3 mb-6">' +
    (recipe.region ? '<span class="text-[10px] font-black text-ec-gold uppercase tracking-[0.3em]">' + escapeHtml(recipe.region) + "</span>" : "") +
    '<span class="w-1 h-1 rounded-full bg-white/10"></span>' +
    '<span class="text-[10px] font-bold text-white/30 uppercase tracking-widest">' + escapeHtml(recipe.difficulty || "Tradicional") + '</span>' +
    "</div>" +
    '<h3 class="font-display font-black text-3xl text-white leading-tight mb-4 group-hover:text-ec-gold transition-colors duration-500">' + escapeHtml(recipe.title) + "</h3>" +
    '<p class="text-white/40 text-sm font-light leading-relaxed line-clamp-2 mb-8">' + escapeHtml(recipe.description || "") + "</p>" +
    '<div class="mt-auto flex items-center justify-between pt-8 border-t border-white/5">' +
    '<div class="flex items-center gap-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">' +
    (recipe.total_time ? '<span class="flex items-center gap-2">⏳ ' + escapeHtml(recipe.total_time) + "</span>" : "") +
    (recipe.servings ? '<span class="flex items-center gap-2">🍽️ ' + escapeHtml(recipe.servings) + "</span>" : "") +
    "</div>" +
    '<span class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-ec-gold group-hover:text-[#0B1221] transition-all">→</span>' +
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
  var videos = (recipe.youtube_videos || [])
    .filter(v => {
      const channel = (v.channel || "").toUpperCase();
      return channel !== "KIWA" && channel !== "KWA"; // Excluir canales no deseados (KWA a veces se confunde con KIWA en logs, pero el usuario especificó KIWA)
    })
    .slice(0, 3);

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
    '<article class="group relative rounded-[48px] overflow-hidden glass-card transition-all duration-700 hover:-translate-y-2">' +
    '<a href="post.html?slug=' + encodeURIComponent(post.slug) + '" class="block" aria-label="' + escapeHtml(post.title) + '">' +
    '<div class="relative h-72 overflow-hidden">' +
    '<img src="' + img + '" alt="' + imgAlt + '" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110">' +
    '<div class="absolute inset-0 bg-gradient-to-t from-[#0B1221] via-transparent to-transparent opacity-80"></div>' +
    (post.featured ? '<div class="absolute top-8 left-8 z-10"><span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-ec-gold text-[#0B1221] shadow-xl border border-white/20">Destacado</span></div>' : "") +
    "</div>" +
    '<div class="p-10">' +
    '<div class="flex items-center gap-3 mb-6">' +
    (post.category ? '<span class="text-[9px] font-black text-ec-gold uppercase tracking-[0.3em]">' + escapeHtml(post.category) + "</span>" : "") +
    '<span class="w-1 h-1 rounded-full bg-white/10"></span>' +
    '<span class="text-[9px] font-bold text-white/30 uppercase tracking-widest">' + escapeHtml(post.reading_time || "4 min") + '</span>' +
    "</div>" +
    '<h3 class="font-display font-black text-3xl text-white leading-tight mb-4 group-hover:text-ec-gold transition-colors duration-500">' + escapeHtml(post.title) + "</h3>" +
    '<p class="text-white/40 text-sm font-light leading-relaxed line-clamp-2 mb-8">' + escapeHtml(post.description || "") + "</p>" +
    '<div class="flex items-center justify-between pt-8 border-t border-white/5">' +
    '<span class="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">' + (post.date_published || "Cr\u00f3nica") + '</span>' +
    '<span class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-ec-gold group-hover:text-[#0B1221] transition-all">→</span>' +
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
