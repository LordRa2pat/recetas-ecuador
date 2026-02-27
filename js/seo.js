// Ecuador a la Carta — js/seo.js
// SEO dinámico: meta tags, schema.org, Open Graph, JSON-LD

'use strict';

import { escapeHtml, timeToISO8601 } from './utils.js';

// ─── Meta upsert ─────────────────────────────────────────────
export function upsertMeta(attrName, attrValue, content) {
  var sel = 'meta[' + attrName + '="' + CSS.escape(attrValue) + '"]';
  var el;
  try { el = document.querySelector(sel); } catch (e) { el = null; }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function setMeta(title, description, imageUrl, canonicalUrl) {
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

// ─── SEO para receta ──────────────────────────────────────────
export function injectSEO(recipe) {
  var canonicalUrl = 'https://ecuadoralacarta.com/recipe.html?slug=' + encodeURIComponent(recipe.slug);
  var imageUrl = recipe.image_url || '';
  var rawKeywords = recipe.keywords || [];
  if (typeof rawKeywords === 'string') {
    rawKeywords = rawKeywords.split(',').map(function (s) { return s.trim(); });
  }
  var allKeywords = rawKeywords.concat(['recetas ecuatorianas', 'cocina ecuatoriana', 'gastronomia ecuatoriana', 'Ecuador a la Carta']).join(', ');

  setMeta(
    recipe.meta_title || (recipe.title + ' \u2014 Receta Ecuatoriana Aut\u00e9ntica | Cocina Ecuador \uD83C\uDDEA\uD83C\uDDE8'),
    recipe.meta_description || recipe.description || ('Aprende a preparar ' + recipe.title + ', una deliciosa receta ecuatoriana tradicional.'),
    recipe.og_image || imageUrl,
    canonicalUrl
  );
  upsertMeta('name', 'keywords', allKeywords);

  var steps = (recipe.instructions || []).map(function (step, i) {
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
    'recipeIngredient': (recipe.ingredients || []).map(function (ing) {
      return typeof ing === 'object' && ing !== null
        ? (ing.quantity ? ing.quantity + ' ' : '') + (ing.name || '')
        : String(ing);
    }),
    'recipeInstructions': steps,
    'keywords': allKeywords,
    'countryOfOrigin': { '@type': 'Country', 'name': 'Ecuador' }
  };

  if (recipe.youtube_videos && recipe.youtube_videos.length > 0) {
    var validVideos = recipe.youtube_videos.filter(function (v) { return !!v.videoId; });
    if (validVideos.length > 0) {
      schema.video = validVideos.map(function (v) {
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

  var breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': 'https://ecuadoralacarta.com/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Recetas', 'item': 'https://ecuadoralacarta.com/recipes.html' },
      { '@type': 'ListItem', 'position': 3, 'name': recipe.title, 'item': canonicalUrl }
    ]
  };

  var schemas = [schema, breadcrumb];
  if (recipe.faqs && recipe.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': recipe.faqs.map(function (faq) {
        return {
          '@type': 'Question',
          'name': faq.q || faq.question || '',
          'acceptedAnswer': { '@type': 'Answer', 'text': faq.a || faq.answer || '' }
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

// ─── SEO para post de blog ────────────────────────────────────
export function injectPostSEO(post) {
  var canonicalUrl = 'https://ecuadoralacarta.com/post.html?slug=' + encodeURIComponent(post.slug);
  var imageUrl = post.image_url || '';
  var rawKeywords = post.keywords || [];
  if (typeof rawKeywords === 'string') {
    rawKeywords = rawKeywords.split(',').map(function (s) { return s.trim(); });
  }
  var keywords = rawKeywords.concat(['turismo ecuador', 'viaje ecuador', 'destinos ecuador']).join(', ');

  setMeta(
    post.meta_title || (post.title + ' | Turismo Ecuador \uD83C\uDDEA\uD83C\uDDE8'),
    post.meta_description || post.description || post.title,
    post.og_image || imageUrl,
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
      'mainEntity': post.faqs.map(function (faq) {
        return { '@type': 'Question', 'name': faq.q || faq.question || '', 'acceptedAnswer': { '@type': 'Answer', 'text': faq.a || faq.answer || '' } };
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

// ─── SEO para página principal (Index) ────────────────────────
export function injectIndexSEO() {
  var orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Ecuador a la Carta',
    'url': 'https://ecuadoralacarta.com',
    'logo': 'https://ecuadoralacarta.com/favicon.ico',
    'sameAs': []
  };

  var webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'url': 'https://ecuadoralacarta.com',
    'name': 'Ecuador a la Carta',
    'description': 'La enciclopedia digital premium de gastronomía y rutas culinarias del Ecuador.',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': 'https://ecuadoralacarta.com/recipes.html?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  var schemas = [orgSchema, webSiteSchema];

  var ld = document.querySelector('script[type="application/ld+json"]');
  if (!ld) {
    ld = document.createElement('script');
    ld.type = 'application/ld+json';
    document.head.appendChild(ld);
  }

  // Only inject if it's the home page and not overriding an existing specific schema
  if (!ld.getAttribute('data-seo-injected')) {
    ld.textContent = JSON.stringify(schemas);
    ld.setAttribute('data-seo-injected', 'true');
  }
}

