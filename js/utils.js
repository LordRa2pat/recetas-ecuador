// Ecuador a la Carta — js/utils.js
// Utilidades: trackEvent, escapeHtml, debounce, timeToISO8601, parseMinutes, sortRecipes
// + delegación global de clicks para tracking

'use strict';

export function trackEvent(eventName, params) {
  try {
    params = params || {};
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(Object.assign({ event: eventName }, params));
    } else if (window._debugTracking) {
      console.debug('[Track]', eventName, params);
    }
  } catch (_) {}
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function debounce(fn, delay) {
  delay = delay || 250;
  var timer;
  return function() {
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(null, args); }, delay);
  };
}

export function timeToISO8601(timeStr) {
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

export function parseMinutes(timeStr) {
  if (!timeStr) return 9999;
  var m = String(timeStr).match(/(\d+)\s*h(?:ora)?s?\s*(\d+)?\s*m?i?n?|(\d+)\s*m?i?n/i);
  if (!m) return 9999;
  if (m[1]) return parseInt(m[1]) * 60 + parseInt(m[2] || 0);
  return parseInt(m[3]);
}

export function sortRecipes(recipes, sortBy) {
  var copy = recipes.slice();
  if (sortBy === 'alpha') return copy.sort(function(a, b) { return a.title.localeCompare(b.title, 'es'); });
  if (sortBy === 'fast') return copy.sort(function(a, b) { return parseMinutes(a.total_time) - parseMinutes(b.total_time); });
  return copy;
}

// Delegación global para clicks en tarjetas de receta/post
document.addEventListener('click', function(e) {
  var anchor = e.target.closest('a[data-track-type]');
  if (!anchor) return;
  var type = anchor.dataset.trackType;
  if (type === 'recipe') {
    trackEvent('recipe_click', {
      slug: anchor.dataset.trackSlug,
      title: anchor.dataset.trackTitle,
      region: anchor.dataset.trackRegion,
      category: anchor.dataset.trackCategory,
      page: window.location.pathname.split('/').pop() || 'index'
    });
  } else if (type === 'post') {
    trackEvent('post_click', {
      slug: anchor.dataset.trackSlug,
      title: anchor.dataset.trackTitle,
      category: anchor.dataset.trackCategory,
      page: window.location.pathname.split('/').pop() || 'index'
    });
  }
});
