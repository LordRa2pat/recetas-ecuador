// Ecuador a la Carta — js/prices.js
// Comparativa de precios de ingredientes (Tuti vs Supermaxi)

'use strict';

import { escapeHtml } from './utils.js';

export function normText(t) {
  return String(t).toLowerCase()
    .replace(/[áàâä]/g, 'a').replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i').replace(/[óòôö]/g, 'o')
    .replace(/[úùûü]/g, 'u').replace(/[ñ]/g, 'n').trim();
}

export function extractIngBase(ing) {
  var t = String(ing).replace(/\([^)]*\)/g, '');
  t = t.replace(/^\d+[\d/.,]*\s*/, '');
  t = t.replace(/^(tazas?|cucharadas?|cucharitas?|cucharaditas?|kg|g\b|gr\b|lb|litros?|ml|cc|unidades?|dientes?|atados?|trozos?|pedazos?|lonjas?|filetes?|pizcas?|ramitas?|manojos?)\s+de\s+/i, '');
  t = t.replace(/^de\s+/i, '');
  return normText(t.split(',')[0].split(';')[0]);
}

export function findPriceEntry(ing, priceDb) {
  if (!priceDb) return null;
  var name = extractIngBase(ing);
  if (priceDb[name]) return priceDb[name];
  for (var key in priceDb) {
    var nk = normText(key);
    if (nk === name || nk.indexOf(name) !== -1 || name.indexOf(nk) !== -1) return priceDb[key];
  }
  var words = name.split(/\s+/).filter(function(w) { return w.length > 4; });
  for (var k in priceDb) {
    var kWords = normText(k).split(/\s+/).filter(function(w) { return w.length > 4; });
    for (var i = 0; i < words.length; i++) {
      if (kWords.indexOf(words[i]) !== -1) return priceDb[k];
    }
  }
  return null;
}

export function renderIngredient(ing, priceDb) {
  var lowerIng = String(ing).toLowerCase();
  var badge = '';
  if (lowerIng.indexOf('supermaxi') !== -1 || lowerIng.indexOf('megamaxi') !== -1) {
    badge = '<span class="ml-auto text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Supermaxi</span>';
  } else if (lowerIng.indexOf('tuti') !== -1) {
    badge = '<span class="ml-auto text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Tuti</span>';
  } else if (lowerIng.indexOf('t\u00eda') !== -1 || (lowerIng.indexOf('tia') !== -1 && lowerIng.indexOf('tia ') !== -1)) {
    badge = '<span class="ml-auto text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full flex-shrink-0">TIA</span>';
  }

  var priceRow = '';
  if (priceDb) {
    var entry = findPriceEntry(ing, priceDb);
    if (entry && entry.reference_price_min) {
      var unit = entry.unit || 'kg';
      var tMin = '$' + entry.reference_price_min.toFixed(2);
      var sMax = '$' + (entry.reference_price_max || entry.reference_price_min).toFixed(2);
      priceRow = '<div class="ml-5 mt-1 flex flex-wrap gap-1.5">' +
        '<span title="Precio referencia Tuti" class="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">' +
        '<span class="font-bold">Tuti</span> ' + tMin + '/' + unit +
        '</span>' +
        '<span title="Precio referencia Supermaxi" class="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">' +
        '<span class="font-bold">Supermaxi</span> ' + sMax + '/' + unit +
        '</span>' +
        '</div>';
    }
  }

  return '<div class="ing-row flex flex-col py-2 border-b border-dashed border-gray-100 last:border-0">' +
    '<label class="flex items-start gap-3 cursor-pointer group">' +
    '<input type="checkbox" class="ing-checkbox mt-0.5" aria-label="Marcar ingrediente">' +
    '<span class="ing-text text-gray-700 font-medium text-sm flex-1 transition-colors group-hover:text-[#0033A0]" data-original="' + escapeHtml(ing) + '">' + escapeHtml(ing) + '</span>' +
    badge +
    '</label>' +
    priceRow +
    '</div>';
}
