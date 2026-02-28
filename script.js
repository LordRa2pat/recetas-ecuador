// ============================================================
// Ecuador a la Carta — script.js v8
// Módulos: js/utils.js, js/data.js, js/ads.js,
//          js/render.js, js/seo.js, js/prices.js, js/i18n.js
// ============================================================

import { trackEvent, escapeHtml, debounce, sortRecipes } from "./js/utils.js";
import { initI18n } from "./js/i18n.js";
import { loadRecipes, loadPosts, loadPriceDb } from "./js/data.js";
import { initAds } from "./js/ads.js";
import {
  getAudienceChip,
  renderSkeleton,
  renderCard,
  renderPlacesCard,
  renderVideosCard,
  renderImageCredit,
  renderEmptyState,
  renderGridWithAds,
  renderBlogCard,
  renderFaqsSection,
} from "./js/render.js";
import { injectSEO, injectPostSEO, setMeta, injectIndexSEO } from "./js/seo.js";
import { renderIngredient } from "./js/prices.js";

// ─── Página: INDEX ────────────────────────────────────────────
async function initIndex() {
  var recipes = await loadRecipes();

  var classicGrid = document.getElementById("classic-grid");
  if (classicGrid) {
    var classics = recipes
      .filter(function (r) {
        return !r.target_audience || r.target_audience === "Local";
      })
      .slice(0, 6);
    if (classics.length > 0) {
      classicGrid.innerHTML = classics.map(renderCard).join("");
    } else if (recipes.length > 0) {
      classicGrid.innerHTML = recipes.slice(0, 6).map(renderCard).join("");
    } else {
      renderEmptyState(
        classicGrid,
        "Pronto publicaremos nuestras primeras recetas cl\u00e1sicas.",
      );
    }
  }

  var diasporaSection = document.getElementById("diaspora-section");
  var diasporaGrid = document.getElementById("diaspora-grid");
  if (diasporaGrid) {
    var diaspora = recipes
      .filter(function (r) {
        return (
          r.target_audience === "Di\u00e1spora" ||
          (r.international_substitutes &&
            r.international_substitutes.length > 0)
        );
      })
      .slice(0, 4);
    if (diaspora.length > 0) {
      diasporaGrid.innerHTML = diaspora.map(renderCard).join("");
      if (diasporaSection) diasporaSection.classList.remove("hidden");
    }
  }

  var tourismSection = document.getElementById("tourism-section");
  var tourismGrid = document.getElementById("tourism-grid");
  if (tourismGrid) {
    var tourism = recipes
      .filter(function (r) {
        return !!r.tourism_route || (r.places && r.places.length > 0);
      })
      .slice(0, 4);
    if (tourism.length > 0) {
      tourismGrid.innerHTML = tourism.map(renderCard).join("");
      if (tourismSection) tourismSection.classList.remove("hidden");
    }
  }

  var searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var q = searchInput.value.trim();
        if (q) {
          trackEvent("search_use", {
            query: q,
            page: "index",
            destination: "recipes",
          });
          window.location.href = "recipes.html?q=" + encodeURIComponent(q);
        }
      }
    });
    var searchBtn = document.getElementById("search-btn");
    if (searchBtn) {
      searchBtn.addEventListener("click", function () {
        var q = searchInput.value.trim();
        if (q) {
          trackEvent("search_use", {
            query: q,
            page: "index",
            destination: "recipes",
          });
          window.location.href = "recipes.html?q=" + encodeURIComponent(q);
        }
      });
    }
  }

  initAds();
  injectIndexSEO();
}

// ─── Página: LISTADO ──────────────────────────────────────────
async function initListing() {
  var recipes = await loadRecipes();
  var grid = document.getElementById("recipes-grid");
  var resultsCount = document.getElementById("results-count");
  var searchInput = document.getElementById("filter-search");
  var regionSel = document.getElementById("filter-region");
  var difficultySel = document.getElementById("filter-difficulty");
  var categorySel = document.getElementById("filter-category");
  var audienceSel = document.getElementById("filter-audience");
  var sortSel = document.getElementById("filter-sort");
  var clearBtn = document.getElementById("clear-filters");

  function populate(sel, key) {
    if (!sel) return;
    var seen = {},
      values = [];
    recipes.forEach(function (r) {
      if (r[key] && !seen[r[key]]) {
        seen[r[key]] = true;
        values.push(r[key]);
      }
    });
    values.sort(function (a, b) {
      return a.localeCompare(b, "es");
    });
    values.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    });
  }
  populate(regionSel, "region");
  populate(difficultySel, "difficulty");
  populate(categorySel, "category");

  var params = new URLSearchParams(window.location.search);
  if (searchInput && params.get("q")) searchInput.value = params.get("q");
  if (regionSel && params.get("region")) regionSel.value = params.get("region");
  if (audienceSel && params.get("audience"))
    audienceSel.value = params.get("audience");

  function applyFilters() {
    var q = searchInput ? searchInput.value.toLowerCase().trim() : "";
    var region = regionSel ? regionSel.value : "";
    var difficulty = difficultySel ? difficultySel.value : "";
    var category = categorySel ? categorySel.value : "";
    var audience = audienceSel ? audienceSel.value : "";
    var sort = sortSel ? sortSel.value : "recent";

    var filtered = recipes.filter(function (r) {
      if (q) {
        var haystack = (
          r.title +
          " " +
          (r.description || "") +
          " " +
          (r.keywords || []).join(" ")
        ).toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }
      if (region && r.region !== region) return false;
      if (difficulty && r.difficulty !== difficulty) return false;
      if (category && r.category !== category) return false;
      if (audience) {
        if (audience === "Di\u00e1spora") {
          if (
            r.target_audience !== "Di\u00e1spora" &&
            !(
              r.international_substitutes &&
              r.international_substitutes.length > 0
            )
          )
            return false;
        } else if (audience === "Turista") {
          if (
            r.target_audience !== "Turista" &&
            !r.tourism_route &&
            !(r.places && r.places.length > 0)
          )
            return false;
        } else {
          if (r.target_audience && r.target_audience !== audience) return false;
        }
      }

      var urlParamsFavorites = new URLSearchParams(window.location.search);
      if (urlParamsFavorites.get("favorites") === "true") {
        var savedFavs = [];
        try {
          savedFavs = JSON.parse(localStorage.getItem("ec_favorites")) || [];
        } catch (e) { }
        if (savedFavs.indexOf(r.slug) === -1) return false;
      }

      return true;
    });

    filtered = sortRecipes(filtered, sort);
    if (resultsCount) {
      resultsCount.textContent =
        filtered.length === 1
          ? "1 receta encontrada"
          : filtered.length + " recetas encontradas";
    }
    renderGridWithAds(filtered, grid, 9);
    initAds();

    // Promgrammatic SEO Hub Update
    updateHubSEO(q, region, category, audience);
  }

  function updateHubSEO(q, region, category, audience) {
    var eyebrowEl = document.getElementById("hub-eyebrow");
    var titleEl = document.getElementById("hub-title");
    var descEl = document.getElementById("hub-description");

    // Configuración estructural para SEO programático (Local Content Curation)
    var hubConfig = {
      default: {
        eyebrow: "Catálogo Completo",
        title: "Todas las Recetas 🍽️",
        desc: "Filtra, ordena y descubre la gastronomía ecuatoriana. El recetario más completo para locales, migrantes y turistas.",
        metaTitle:
          "Recetas Ecuatorianas \u2014 Cat\u00e1logo Completo | Ecuador a la Carta",
      },
      search: {
        eyebrow: "Resultados de Búsqueda",
        title: 'Buscando: "' + q + '" 🔍',
        desc: "Encontramos estas recetas ecuatorianas coincidentes con tu búsqueda.",
        metaTitle: 'Resultados para "' + q + '" | Ecuador a la Carta',
      },
      region_Sierra: {
        eyebrow: "Región Andina",
        title: "Comida de la Sierra Ecuatoriana ⛰️",
        desc: "Sopas espesas, maíz, cerdo y papas. Descubre el Locro, el Hornado, la Fritada y los secretos del clima frío andino.",
        metaTitle:
          "Platos y Recetas de la Sierra de Ecuador | Ecuador a la Carta",
      },
      region_Costa: {
        eyebrow: "Región Litoral",
        title: "Comida de la Costa Ecuatoriana 🌊",
        desc: "Mariscos frescos, plátano verde y maní. Aprende a preparar un Encebollado perfecto, Ceviches y Tigrillo.",
        metaTitle:
          "Recetas y Platos de la Costa de Ecuador | Ecuador a la Carta",
      },
      region_Amazonia: {
        eyebrow: "Región Amazónica",
        title: "Comida de la Amazonía Ecuatoriana 🌿",
        desc: "Sabores exóticos de la selva: cocciones en hojas de bijao, yuca, ayampacos y maito de pescado salvaje.",
        metaTitle:
          "Recetas y Comida de la Amazonía del Ecuador | Ecuador a la Carta",
      },
      region_Galapagos: {
        eyebrow: "Región Insular",
        title: "Comida de Galápagos 🐢",
        desc: "Langosta, pescado brujo y delicias del mar en las Islas Encantadas de Ecuador.",
        metaTitle: "Recetas y Platos Típicos de Galápagos | Ecuador a la Carta",
      },
      category_Sopas: {
        eyebrow: "Platos de Cuchara",
        title: "Sopas y Locros Ecuatorianos 🍲",
        desc: "Ecuador es el país de las sopas. Desde caldos ligeros hasta chupes y locros cremosos para el alma.",
        metaTitle:
          "Recetas de Sopas Ecuatorianas tradicionales | Ecuador a la Carta",
      },
      category_Platos_Fuertes: {
        eyebrow: "Plato Principal",
        title: "Platos Fuertes Ecuatorianos 🍽️",
        desc: "Secos, guatita, encocados y churrascos. Los platos principales que definen el almuerzo ecuatoriano.",
        metaTitle:
          "Recetas de Platos Fuertes y Almuerzos de Ecuador | Ecuador a la Carta",
      },
      category_Mariscos: {
        eyebrow: "Delicias del Mar",
        title: "Recetas con Mariscos 🦐",
        desc: "Cangrejos, camarones, conchas y pescado fresco. Las mejores recetas costeñas con frutos del mar.",
        metaTitle:
          "Recetas Ecuatorianas con Mariscos y Pescado | Ecuador a la Carta",
      },
      category_Postres: {
        eyebrow: "Dulces Tradicionales",
        title: "Postres Ecuatorianos 🍮",
        desc: "Higos con queso, melcochas, pristiños y espumillas. Los dulces históricos del Ecuador.",
        metaTitle: "Postres y Dulces Típicos del Ecuador | Ecuador a la Carta",
      },
      category_Bebidas: {
        eyebrow: "Refrescos y Tradición",
        title: "Bebidas Ecuatorianas 🥤",
        desc: "Colada Morada, chicha, canelazo y jugos tropicales únicos de nuestras frutas autóctonas.",
        metaTitle:
          "Recetas de Bebidas, Zumos y Licores Ecuatorianos | Ecuador a la Carta",
      },
      audience_Diaspora: {
        eyebrow: "Para Migrantes",
        title: "Recetas para la Diáspora ✈️",
        desc: "Adaptamos nuestras recetas a los ingredientes disponibles en mercados de Estados Unidos y Europa. Reemplazos inteligentes para que sepa a casa.",
        metaTitle:
          "Recetas Ecuatorianas con Sustitutos para el Extranjero | Ecuador a la Carta",
      },
      audience_Turista: {
        eyebrow: "Turismo Gastronómico",
        title: "Rutas Gastronómicas 🗺️",
        desc: "Platos emblemáticos y dónde probarlos en tu viaje a Ecuador. Glosario culinario para extranjeros.",
        metaTitle:
          "Turismo Gastronómico: Comida Típica de Ecuador | Ecuador a la Carta",
      },
    };

    var current = hubConfig["default"];
    var currentUrlPath = window.location.pathname + window.location.search;

    if (q) current = hubConfig["search"];
    else if (region) current = hubConfig["region_" + region] || current;
    else if (category)
      current = hubConfig["category_" + category.replace(" ", "_")] || current;
    else if (audience)
      current = hubConfig["audience_" + audience.replace("á", "a")] || current;

    if (titleEl) titleEl.textContent = current.title;
    if (eyebrowEl) eyebrowEl.textContent = current.eyebrow;
    if (descEl) descEl.textContent = current.desc;

    // Inject SEO Meta Tags natively
    var canonical = "https://ecuadoralacarta.com" + currentUrlPath;
    setMeta(current.metaTitle, current.desc, "", canonical);
  }

  var debouncedApply = debounce(function () {
    applyFilters();
    var q = searchInput ? searchInput.value.trim() : "";
    if (q) trackEvent("search_use", { query: q, page: "recipes" });
  }, 300);
  if (searchInput) searchInput.addEventListener("input", debouncedApply);
  if (regionSel)
    regionSel.addEventListener("change", function () {
      applyFilters();
      if (regionSel.value)
        trackEvent("filter_use", {
          filter_type: "region",
          value: regionSel.value,
          page: "recipes",
        });
    });
  if (difficultySel)
    difficultySel.addEventListener("change", function () {
      applyFilters();
      if (difficultySel.value)
        trackEvent("filter_use", {
          filter_type: "difficulty",
          value: difficultySel.value,
          page: "recipes",
        });
    });
  if (categorySel)
    categorySel.addEventListener("change", function () {
      applyFilters();
      if (categorySel.value)
        trackEvent("filter_use", {
          filter_type: "category",
          value: categorySel.value,
          page: "recipes",
        });
    });
  if (audienceSel)
    audienceSel.addEventListener("change", function () {
      applyFilters();
      if (audienceSel.value)
        trackEvent("filter_use", {
          filter_type: "audience",
          value: audienceSel.value,
          page: "recipes",
        });
    });
  if (sortSel)
    sortSel.addEventListener("change", function () {
      applyFilters();
      trackEvent("filter_use", {
        filter_type: "sort",
        value: sortSel.value,
        page: "recipes",
      });
    });
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (searchInput) searchInput.value = "";
      if (regionSel) regionSel.value = "";
      if (difficultySel) difficultySel.value = "";
      if (categorySel) categorySel.value = "";
      if (audienceSel) audienceSel.value = "";
      if (sortSel) sortSel.value = "recent";
      applyFilters();
    });
  }

  if (grid) grid.innerHTML = renderSkeleton(6);

  var paramsFavs = new URLSearchParams(window.location.search);
  if (paramsFavs.get("favorites") === "true") {
    var pageTitle = document.querySelector("h1");
    var pageDesc = document.querySelector("h1 + p");
    if (pageTitle) pageTitle.textContent = "❤️ Mi Recetario";
    if (pageDesc)
      pageDesc.textContent =
        "Tus recetas guardadas para preparar cuando quieras.";
    document.title = "Mi Recetario | Ecuador a la Carta";
  }

  applyFilters();
}

// ─── Lógica de Favoritos y Sticky Menu ────────────────────────
function initFavoritesAndSticky(recipe) {
  var slug = recipe.slug;
  var btnMain = document.getElementById("btn-favorite");
  var btnSticky = document.getElementById("sticky-btn-favorite");
  var stickyBar = document.getElementById("sticky-recipe-bar");
  var heroImg = document.getElementById("recipe-hero-img");

  // Populate sticky bar text
  var stickyTitle = document.getElementById("sticky-recipe-title");
  var stickyTime = document.getElementById("sticky-recipe-time");
  if (stickyTitle) stickyTitle.textContent = recipe.title;
  if (stickyTime) stickyTime.textContent = recipe.total_time || "-- min";

  function getFavorites() {
    try {
      return JSON.parse(localStorage.getItem("ec_favorites")) || [];
    } catch (e) {
      return [];
    }
  }
  function isFavorite(slug) {
    return getFavorites().indexOf(slug) !== -1;
  }

  function updateButtonsUI() {
    var isFav = isFavorite(slug);
    var svgFilled =
      '<svg class="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
    var svgEmpty =
      '<svg class="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';

    if (btnMain) {
      btnMain.innerHTML =
        (isFav ? svgFilled : svgEmpty) +
        '<span class="btn-text">' +
        (isFav ? "Guardado" : "Guardar") +
        "</span>";
      if (isFav) {
        btnMain.classList.replace("bg-white", "bg-rose-500");
        btnMain.classList.replace("text-rose-500", "text-white");
        btnMain.classList.replace("hover:bg-rose-50", "hover:bg-rose-600");
        btnMain.classList.replace("hover:text-rose-600", "hover:text-white");
      } else {
        btnMain.classList.replace("bg-rose-500", "bg-white");
        btnMain.classList.replace("text-white", "text-rose-500");
        btnMain.classList.replace("hover:bg-rose-600", "hover:bg-rose-50");
        btnMain.classList.replace("hover:text-white", "hover:text-rose-600");
      }
    }
    if (btnSticky) {
      btnSticky.innerHTML = isFav ? svgFilled : svgEmpty;
      if (isFav) {
        btnSticky.classList.replace("bg-rose-50", "bg-rose-500");
        btnSticky.classList.replace("text-rose-500", "text-white");
        btnSticky.classList.replace("hover:bg-rose-100", "hover:bg-rose-600");
      } else {
        btnSticky.classList.replace("bg-rose-500", "bg-rose-50");
        btnSticky.classList.replace("text-white", "text-rose-500");
        btnSticky.classList.replace("hover:bg-rose-600", "hover:bg-rose-100");
      }
    }
  }

  function toggleFavorite() {
    var favs = getFavorites();
    var idx = favs.indexOf(slug);
    if (idx !== -1) favs.splice(idx, 1);
    else favs.push(slug);
    localStorage.setItem("ec_favorites", JSON.stringify(favs));
    updateButtonsUI();
    trackEvent("recipe_favorite_toggle", {
      slug: slug,
      action: idx !== -1 ? "remove" : "add",
    });
  }

  if (btnMain) btnMain.addEventListener("click", toggleFavorite);
  if (btnSticky) btnSticky.addEventListener("click", toggleFavorite);

  updateButtonsUI();

  // Scroll listener for Sticky Bar
  if (stickyBar && heroImg) {
    var observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          stickyBar.classList.add(
            "-translate-y-full",
            "opacity-0",
            "pointer-events-none",
          );
        } else {
          stickyBar.classList.remove(
            "-translate-y-full",
            "opacity-0",
            "pointer-events-none",
          );
        }
      },
      { threshold: 0 },
    );
    observer.observe(heroImg);
  }
}

// ─── Página: RECETA ───────────────────────────────────────────
async function initRecipe() {
  var params = new URLSearchParams(window.location.search);
  var slug = params.get("slug");
  var loadingEl = document.getElementById("recipe-loading");
  var errorEl = document.getElementById("recipe-error");
  var contentEl = document.getElementById("recipe-content");

  if (!slug) {
    if (loadingEl) loadingEl.classList.add("hidden");
    if (errorEl) {
      errorEl.classList.remove("hidden");
      var msgEl = errorEl.querySelector("[data-error-msg]");
      if (msgEl) msgEl.textContent = "No se especific\u00f3 ninguna receta.";
    }
    return;
  }

  var recipes = await loadRecipes();
  var priceDb = await loadPriceDb();
  var recipe = null;
  for (var i = 0; i < recipes.length; i++) {
    if (recipes[i].slug === slug) {
      recipe = recipes[i];
      break;
    }
  }

  if (loadingEl) loadingEl.classList.add("hidden");

  if (!recipe) {
    if (errorEl) {
      errorEl.classList.remove("hidden");
      var msgEl2 = errorEl.querySelector("[data-error-msg]");
      if (msgEl2)
        msgEl2.textContent =
          'No encontramos la receta "' + escapeHtml(slug) + '".';
    }
    return;
  }

  if (contentEl) contentEl.classList.remove("hidden");

  injectSEO(recipe);

  var bcRecipe = document.getElementById("bc-recipe");
  if (bcRecipe) bcRecipe.textContent = recipe.title;

  var heroImg = document.getElementById("recipe-hero-img");
  if (heroImg) {
    heroImg.src =
      recipe.image_url ||
      "https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200&q=80";
    heroImg.alt = recipe.image_alt || recipe.title;
    heroImg.onerror = function () {
      this.src =
        "https://images.unsplash.com/photo-1567337710282-00832b415979?w=1200&q=80";
    };
  }

  var creditEl = document.getElementById("image-credit");
  if (creditEl) {
    if (recipe._image_source_url) {
      try {
        var host = new URL(recipe._image_source_url).hostname;
        if (host.startsWith("www.")) host = host.substring(4);
        creditEl.innerHTML =
          'Fuente: <a href="' +
          escapeHtml(recipe._image_source_url) +
          '" target="_blank" rel="noopener nofollow" class="underline hover:text-gray-700 transition-colors">' +
          escapeHtml(host) +
          "</a>";
        creditEl.classList.remove("hidden");
      } catch (e) {
        creditEl.classList.add("hidden");
      }
    } else {
      creditEl.classList.add("hidden");
    }
  }

  var heroChip = document.getElementById("recipe-audience-chip");
  if (heroChip) {
    var chip = getAudienceChip(recipe);
    if (chip) {
      heroChip.innerHTML = chip;
      heroChip.classList.remove("hidden");
    }
  }

  var fields = [
    ["recipe-title", recipe.title],
    ["recipe-description", recipe.description],
    ["recipe-region", recipe.region],
    ["recipe-difficulty", recipe.difficulty],
    ["recipe-category", recipe.category],
    ["recipe-servings", recipe.servings],
    ["recipe-prep-time", recipe.prep_time],
    ["recipe-cook-time", recipe.cook_time],
    ["recipe-total-time", recipe.total_time],
  ];
  fields.forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    if (el && pair[1]) {
      el.textContent = pair[1];
    } else if (el && !pair[1]) {
      var parent = el.closest("[data-optional]");
      if (parent) parent.classList.add("hidden");
    }
  });

  // --- Integración Escalado de Porciones ---
  var baseServings = 2; // Default fallback
  if (recipe.servings) {
    var match = recipe.servings.match(/\d+/);
    if (match) baseServings = parseInt(match[0], 10);
  }
  var currentServings = baseServings;

  var servingsCounterEl = document.getElementById("servings-counter");
  var btnServMinus = document.getElementById("btn-servings-minus");
  var btnServPlus = document.getElementById("btn-servings-plus");
  if (servingsCounterEl) servingsCounterEl.textContent = currentServings;

  function parseAndScaleIngredientList() {
    var ingList = document.getElementById("ingredients-list");
    if (!ingList || !recipe.ingredients) return;

    var scaleFactor = currentServings / baseServings;

    ingList.innerHTML = recipe.ingredients
      .map(function (ing) {
        var scaledText = ing;
        if (scaleFactor !== 1) {
          // Find leading numbers like "1/2", "1.5", "2", "1 1/2", "1,5"
          scaledText = ing.replace(
            /^(\d+\s*\/\s*\d+|\d+[\.,]\d+|\d+\s+\d+\/\d+|\d+)\s*/,
            function (match, p1) {
              try {
                var num = 0;
                var parts = p1.trim().split(/\s+/);

                if (parts.length === 2 && parts[1].indexOf("/") !== -1) {
                  // e.g. "1 1/2"
                  var fraction = parts[1].split("/");
                  num =
                    parseInt(parts[0], 10) +
                    parseInt(fraction[0], 10) / parseInt(fraction[1], 10);
                } else if (p1.indexOf("/") !== -1) {
                  // e.g. "1/2"
                  var fraction = p1.split("/");
                  num = parseInt(fraction[0], 10) / parseInt(fraction[1], 10);
                } else {
                  // e.g. "2" or "1.5" or "1,5"
                  num = parseFloat(p1.replace(",", "."));
                }

                var newNum = num * scaleFactor;

                // Format output elegantly
                var outstr =
                  newNum % 1 !== 0
                    ? newNum.toFixed(1).replace(/\.0$/, "").replace(".", ",")
                    : newNum;
                // Add original trailing space back
                return outstr + (match.endsWith(" ") ? " " : "");
              } catch (e) {
                return match;
              }
            },
          );
        }
        return renderIngredient(scaledText, priceDb);
      })
      .join("");
  }

  // Initial render
  parseAndScaleIngredientList();

  if (btnServMinus && btnServPlus) {
    btnServMinus.addEventListener("click", function () {
      if (currentServings > 1) {
        currentServings--;
        servingsCounterEl.textContent = currentServings;
        parseAndScaleIngredientList();
      }
    });
    btnServPlus.addEventListener("click", function () {
      if (currentServings < 25) {
        currentServings++;
        servingsCounterEl.textContent = currentServings;
        parseAndScaleIngredientList();
      }
    });
  }

  // --- Integración Cook Mode Premium (Rewarded Ad Flow) ---
  var btnCookMode = document.getElementById("btn-cook-mode");
  var wakeLock = null;
  var recognition = null;
  var chefModeBadge = document.getElementById("chef-mode-badge");

  function stopChefMode() {
    document.body.classList.remove("cook-mode-active");
    btnCookMode.innerHTML = '<span class="text-xl">👩‍🍳</span> MODO CHEF (MANOS LIBRES)';
    btnCookMode.classList.remove("bg-red-500", "text-white");
    btnCookMode.classList.add("bg-gradient-to-r", "from-ec-gold", "to-yellow-400");
    if (chefModeBadge) chefModeBadge.style.display = "none";

    if (wakeLock !== null) {
      wakeLock.release().then(() => { wakeLock = null; });
    }
    if (recognition) {
      recognition.stop();
      recognition = null;
    }
  }

  async function startChefMode() {
    // 1. Simular Rewarded Ad
    btnCookMode.innerHTML = "<span>⏳ Cargando Experiencia...</span>";
    btnCookMode.disabled = true;

    // Simulación de 3 segundos de "Ad"
    await new Promise(r => setTimeout(r, 2000));

    // Activar Modo
    document.body.classList.add("cook-mode-active");
    btnCookMode.innerHTML = '<span class="text-white font-bold">✖ DETENER MODO CHEF</span>';
    btnCookMode.classList.remove("bg-gradient-to-r", "from-ec-gold", "to-yellow-400");
    btnCookMode.classList.add("bg-red-500", "text-white");
    btnCookMode.disabled = false;
    if (chefModeBadge) chefModeBadge.style.display = "flex";

    // 2. Wake Lock
    try {
      if ("wakeLock" in navigator) {
        wakeLock = await navigator.wakeLock.request("screen");
      }
    } catch (err) {
      console.warn("Wake Lock not supported");
    }

    // 3. Speech Recognition (Hands-Free)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'es-EC';
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log("Comando Chef:", command);
        if (command.includes("siguiente") || command.includes("próximo")) {
          // Lógica para scroll al siguiente paso (si tuviéramos IDs de pasos)
          console.log("Navegando al siguiente paso...");
        }
      };

      recognition.start();
    }
  }

  if (btnCookMode) {
    btnCookMode.addEventListener("click", function () {
      if (document.body.classList.contains("cook-mode-active")) {
        stopChefMode();
      } else {
        startChefMode();
      }
    });
  }

  var instrList = document.getElementById("instructions-list");
  if (instrList && recipe.instructions && recipe.instructions.length > 0) {
    instrList.innerHTML = recipe.instructions
      .map(function (step, i) {
        var text = typeof step === "string" ? step : step.text || step;
        return (
          '<li class="flex gap-4 mb-5">' +
          '<div class="flex-shrink-0 w-8 h-8 rounded-full bg-[#0033A0] text-white flex items-center justify-center font-bold text-sm">' +
          (i + 1) +
          "</div>" +
          '<p class="text-gray-700 leading-relaxed pt-1">' +
          escapeHtml(text) +
          "</p>" +
          "</li>"
        );
      })
      .join("");
  }

  var tipsList = document.getElementById("tips-list");
  if (tipsList && recipe.tips && recipe.tips.length > 0) {
    tipsList.innerHTML = recipe.tips
      .map(function (tip) {
        return (
          '<li class="flex gap-2 py-1.5">' +
          '<span class="text-[#FFD100] flex-shrink-0 mt-0.5">\uD83D\uDCA1</span>' +
          '<span class="text-gray-700">' +
          escapeHtml(tip) +
          "</span>" +
          "</li>"
        );
      })
      .join("");
    var tipsParent = tipsList.closest("[data-optional]");
    if (tipsParent) tipsParent.classList.remove("hidden");
  }

  var kwEl = document.getElementById("recipe-keywords");
  if (kwEl && recipe.keywords && recipe.keywords.length > 0) {
    kwEl.innerHTML = recipe.keywords
      .map(function (kw) {
        return (
          '<a href="recipes.html?q=' +
          encodeURIComponent(kw) +
          '" class="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-[#0033A0] hover:text-white transition-colors duration-200">' +
          escapeHtml(kw) +
          "</a>"
        );
      })
      .join("");
    var kwParent = kwEl.closest("[data-optional]");
    if (kwParent) kwParent.classList.remove("hidden");
  }

  var subEl = document.getElementById("substitutes-card");
  if (
    subEl &&
    recipe.international_substitutes &&
    recipe.international_substitutes.length > 0
  ) {
    var subsRows = recipe.international_substitutes
      .map(function (s) {
        return (
          '<tr class="border-b border-blue-100/60 last:border-0">' +
          '<td class="py-2 pr-3 font-medium text-gray-800">' +
          escapeHtml(s.original || "") +
          "</td>" +
          '<td class="py-2 pr-3 text-gray-600">' +
          escapeHtml(s.sustituto_usa || "-") +
          "</td>" +
          '<td class="py-2 text-gray-600">' +
          escapeHtml(s.sustituto_europa || "-") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    subEl.innerHTML =
      '<div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-3xl p-5 backdrop-blur-sm">' +
      '<h3 class="font-bold text-blue-800 text-sm mb-3 flex items-center gap-2">\u2708\uFE0F Ingredientes en el Extranjero</h3>' +
      '<p class="text-blue-600 text-xs mb-4">\u00bfEst\u00e1s fuera de Ecuador? Estos son los equivalentes que puedes encontrar.</p>' +
      '<div class="overflow-x-auto"><table class="w-full text-xs">' +
      '<thead><tr class="text-blue-600 font-semibold border-b border-blue-200/60">' +
      '<th class="text-left pb-2 pr-3">Original (Ecuador)</th>' +
      '<th class="text-left pb-2 pr-3">\uD83C\uDDFA\uD83C\uDDF8 EE.UU.</th>' +
      '<th class="text-left pb-2">\uD83C\uDDEA\uD83C\uDDF8 Europa</th>' +
      "</tr></thead>" +
      "<tbody>" +
      subsRows +
      "</tbody>" +
      "</table></div>" +
      "</div>";
    subEl.classList.remove("hidden");
  }

  var tourEl = document.getElementById("tourism-card");
  if (tourEl && recipe.tourism_route) {
    tourEl.innerHTML =
      '<div class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl p-5 backdrop-blur-sm">' +
      '<h3 class="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">\uD83D\uDDFA\uFE0F Ruta Gastron\u00f3mica 2026</h3>' +
      '<p class="text-amber-700 leading-relaxed text-sm">' +
      escapeHtml(recipe.tourism_route) +
      "</p>" +
      "</div>";
    tourEl.classList.remove("hidden");
  }

  renderPlacesCard(recipe);
  renderVideosCard(recipe);
  renderImageCredit(recipe);
  renderFaqsSection(recipe);

  var costRow = document.getElementById("estimated-cost-row");
  var costVal = document.getElementById("estimated-cost-value");
  if (costRow && costVal && recipe.estimated_cost) {
    costVal.textContent = recipe.estimated_cost;
    costRow.classList.remove("hidden");
  }

  var pinterestBtn = document.getElementById("pinterest-btn");
  if (pinterestBtn) {
    var pinImgUrl = encodeURIComponent(recipe.image_url || "");
    var pinDesc = encodeURIComponent(
      recipe.title + " — Ecuador a la Carta | " + (recipe.description || ""),
    );
    var pinPageUrl = encodeURIComponent(
      "https://ecuadoralacarta.com/recipe.html?slug=" + (recipe.slug || ""),
    );
    pinterestBtn.href =
      "https://pinterest.com/pin/create/button/?url=" +
      pinPageUrl +
      "&media=" +
      pinImgUrl +
      "&description=" +
      pinDesc;
  }

  var socialShare = document.getElementById("social-share");
  if (socialShare) {
    var pageUrl = encodeURIComponent(
      "https://ecuadoralacarta.com/recipe.html?slug=" + (recipe.slug || ""),
    );
    var shareText = encodeURIComponent(
      "\uD83C\uDF7D\uFE0F " +
      recipe.title +
      " \u2014 Receta ecuatoriana aut\u00e9ntica | Ecuador a la Carta",
    );
    var waShare = document.getElementById("share-whatsapp");
    var fbShare = document.getElementById("share-facebook");
    var xShare = document.getElementById("share-x");
    var pinShare = document.getElementById("share-pinterest");
    if (waShare) {
      waShare.href = "https://wa.me/?text=" + shareText + "%20" + pageUrl;
      waShare.addEventListener("click", function () {
        trackEvent("social_share", { platform: "whatsapp", slug: recipe.slug });
      });
    }
    if (fbShare) {
      fbShare.href = "https://www.facebook.com/sharer/sharer.php?u=" + pageUrl;
      fbShare.addEventListener("click", function () {
        trackEvent("social_share", { platform: "facebook", slug: recipe.slug });
      });
    }
    if (xShare) {
      xShare.href =
        "https://x.com/intent/tweet?text=" + shareText + "&url=" + pageUrl;
      xShare.addEventListener("click", function () {
        trackEvent("social_share", { platform: "x", slug: recipe.slug });
      });
    }
    if (pinShare) {
      pinShare.href =
        "https://pinterest.com/pin/create/button/?url=" +
        pageUrl +
        "&media=" +
        encodeURIComponent(recipe.image_url || "") +
        "&description=" +
        shareText;
      pinShare.addEventListener("click", function () {
        trackEvent("social_share", {
          platform: "pinterest",
          slug: recipe.slug,
        });
      });
    }
    socialShare.classList.remove("hidden");
  }

  if (recipe.en_translation) {
    var langWrap = document.getElementById("lang-toggle-wrap");
    var langBtn = document.getElementById("lang-toggle");
    var langFlag = document.getElementById("lang-flag");
    var langText = document.getElementById("lang-text");
    var titleEl = document.getElementById("recipe-title");
    var descEl = document.getElementById("recipe-description");
    if (langWrap && langBtn) {
      langWrap.classList.remove("hidden");
      var isEnglish = false;
      var esTitle = recipe.title;
      var esDesc = recipe.description || "";
      var enTitle = recipe.en_translation.title || recipe.title;
      var enDesc =
        recipe.en_translation.description || recipe.description || "";
      langBtn.addEventListener("click", function () {
        isEnglish = !isEnglish;
        if (titleEl) titleEl.textContent = isEnglish ? enTitle : esTitle;
        if (descEl) descEl.textContent = isEnglish ? enDesc : esDesc;
        if (langFlag)
          langFlag.textContent = isEnglish
            ? "\uD83C\uDDEA\uD83C\uDDE8"
            : "\uD83C\uDDFA\uD83C\uDDF8";
        if (langText)
          langText.textContent = isEnglish
            ? "Ver en Espa\u00f1ol"
            : "Ver en English";
        document.documentElement.lang = isEnglish ? "en" : "es";
      });
    }
  }

  // --- Integración Lista de Compras ---
  var btnGrocery = document.getElementById("btn-grocery-list");
  if (btnGrocery) {
    btnGrocery.addEventListener("click", function () {
      var originalText = this.innerHTML;
      this.innerHTML =
        '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span class="btn-text">¡Añadido a tu lista!</span>';
      this.classList.replace("bg-[#0033A0]", "bg-gray-800");
      trackEvent("grocery_list_add", { slug: slug });
      setTimeout(function () {
        btnGrocery.innerHTML = originalText;
        btnGrocery.classList.replace("bg-gray-800", "bg-[#0033A0]");
      }, 3000);
    });
  }

  // --- Integración de Reseñas (Mock) ---
  var reviewForm = document.getElementById("review-form");
  var starsPicker = document.getElementById("review-stars-picker");
  var reviewStars = 5;

  if (starsPicker) {
    var starsBtns = starsPicker.querySelectorAll("button");
    function updateStars() {
      starsBtns.forEach(function (b) {
        if (parseInt(b.getAttribute("data-val")) <= reviewStars) {
          b.classList.add("text-yellow-400");
          b.classList.remove("text-gray-300");
        } else {
          b.classList.remove("text-yellow-400");
          b.classList.add("text-gray-300");
        }
      });
    }
    updateStars();
    starsBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        reviewStars = parseInt(this.getAttribute("data-val"));
        updateStars();
      });
    });
  }

  var photoInput = document.getElementById("review-photo");
  var photoName = document.getElementById("review-photo-name");
  if (photoInput && photoName) {
    photoInput.addEventListener("change", function () {
      if (this.files && this.files[0]) {
        photoName.textContent = this.files[0].name;
      }
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var textInput = document.getElementById("review-text").value;
      if (!textInput.trim()) return;

      var list = document.getElementById("reviews-list");
      var fotoHtml = "";
      if (photoInput && photoInput.files && photoInput.files[0]) {
        fotoHtml =
          '<img src="' +
          URL.createObjectURL(photoInput.files[0]) +
          '" class="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl shadow-sm mt-3">';
      }

      var starsHtml = "";
      for (var i = 1; i <= 5; i++) {
        starsHtml += i <= reviewStars ? "★" : "☆";
      }

      var html =
        '<div class="flex gap-4 mb-6">' +
        '<div class="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold shrink-0">TU</div>' +
        "<div>" +
        '<div class="flex items-center gap-2 mb-1">' +
        '<span class="font-bold text-gray-800">Tú</span>' +
        '<span class="text-yellow-400 text-sm">' +
        starsHtml +
        "</span>" +
        '<span class="text-xs text-gray-400">Justo ahora</span>' +
        "</div>" +
        '<p class="text-gray-600 text-sm">' +
        escapeHtml(textInput) +
        "</p>" +
        fotoHtml +
        "</div>" +
        "</div>";
      list.insertAdjacentHTML("afterbegin", html);
      reviewForm.reset();
      if (photoName) photoName.textContent = "";
      reviewStars = 5;
      if (typeof updateStars === "function") updateStars();
      trackEvent("review_submitted", { slug: slug, stars: reviewStars });
    });
  }

  initRating(slug);
  initFavoritesAndSticky(recipe);
  initAds();
}

// ─── Página: BLOG ─────────────────────────────────────────────
async function initBlog() {
  var posts = await loadPosts();
  var grid = document.getElementById("blog-grid");
  var resultsCount = document.getElementById("blog-results-count");
  var searchInput = document.getElementById("blog-search");
  var categorySel = document.getElementById("blog-category");
  var regionSel = document.getElementById("blog-region");
  var clearBtn = document.getElementById("blog-clear");

  if (categorySel) {
    var seenCats = {},
      cats = [];
    posts.forEach(function (p) {
      if (p.category && !seenCats[p.category]) {
        seenCats[p.category] = 1;
        cats.push(p.category);
      }
    });
    cats.sort().forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      categorySel.appendChild(opt);
    });
  }
  if (regionSel) {
    var seenRegs = {},
      regs = [];
    posts.forEach(function (p) {
      if (p.region && !seenRegs[p.region]) {
        seenRegs[p.region] = 1;
        regs.push(p.region);
      }
    });
    regs.sort().forEach(function (r) {
      var opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r;
      regionSel.appendChild(opt);
    });
  }

  function applyBlogFilters() {
    var q = searchInput ? searchInput.value.toLowerCase().trim() : "";
    var cat = categorySel ? categorySel.value : "";
    var reg = regionSel ? regionSel.value : "";

    var filtered = posts.filter(function (p) {
      if (q) {
        var hay = (
          p.title +
          " " +
          (p.description || "") +
          " " +
          (p.keywords || []).join(" ")
        ).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      if (cat && p.category !== cat) return false;
      if (reg && p.region !== reg) return false;
      return true;
    });

    if (resultsCount) {
      resultsCount.textContent =
        filtered.length === 1
          ? "1 art\u00edculo"
          : filtered.length + " art\u00edculos";
    }

    if (!grid) return;
    if (filtered.length === 0) {
      if (posts.length === 0) {
        grid.innerHTML =
          '<div class="col-span-full text-center py-20 text-gray-400">' +
          '<div class="text-6xl mb-4">\uD83D\uDCF0</div>' +
          '<p class="text-lg font-medium text-gray-500">El blog de turismo se est\u00e1 preparando</p>' +
          '<p class="text-sm mt-1">En breve publicaremos nuestros primeros art\u00edculos sobre destinos y cultura ecuatoriana.</p>' +
          "</div>";
      } else {
        grid.innerHTML =
          '<div class="col-span-full text-center py-12 text-gray-400">' +
          '<p class="text-lg font-medium">Sin art\u00edculos con esos filtros</p>' +
          "</div>";
      }
      return;
    }
    grid.innerHTML = filtered.map(renderBlogCard).join("");
  }

  var urlParams = new URLSearchParams(window.location.search);
  if (searchInput && urlParams.get("q")) searchInput.value = urlParams.get("q");
  if (categorySel && urlParams.get("category"))
    categorySel.value = urlParams.get("category");
  if (regionSel && urlParams.get("region"))
    regionSel.value = urlParams.get("region");

  if (searchInput)
    searchInput.addEventListener(
      "input",
      debounce(function () {
        applyBlogFilters();
        var q = searchInput.value.trim();
        if (q) trackEvent("search_use", { query: q, page: "blog" });
      }, 300),
    );
  if (categorySel)
    categorySel.addEventListener("change", function () {
      applyBlogFilters();
      if (categorySel.value)
        trackEvent("filter_use", {
          filter_type: "category",
          value: categorySel.value,
          page: "blog",
        });
    });
  if (regionSel)
    regionSel.addEventListener("change", function () {
      applyBlogFilters();
      if (regionSel.value)
        trackEvent("filter_use", {
          filter_type: "region",
          value: regionSel.value,
          page: "blog",
        });
    });
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (searchInput) searchInput.value = "";
      if (categorySel) categorySel.value = "";
      if (regionSel) regionSel.value = "";
      applyBlogFilters();
    });
  }

  if (grid) grid.innerHTML = renderSkeleton(3);
  applyBlogFilters();
}

// ─── Página: POST ─────────────────────────────────────────────
async function initPost() {
  var params = new URLSearchParams(window.location.search);
  var slug = params.get("slug");
  var loadingEl = document.getElementById("post-loading");
  var errorEl = document.getElementById("post-error");
  var contentEl = document.getElementById("post-content");

  if (!slug) {
    if (loadingEl) loadingEl.classList.add("hidden");
    if (errorEl) errorEl.classList.remove("hidden");
    return;
  }

  var posts = await loadPosts();
  var post = null;
  for (var i = 0; i < posts.length; i++) {
    if (posts[i].slug === slug) {
      post = posts[i];
      break;
    }
  }

  if (loadingEl) loadingEl.classList.add("hidden");

  if (!post) {
    if (errorEl) {
      errorEl.classList.remove("hidden");
      var msgEl = errorEl.querySelector("[data-error-msg]");
      if (msgEl)
        msgEl.textContent =
          'No encontramos el art\u00edculo "' + escapeHtml(slug) + '".';
    }
    return;
  }

  if (contentEl) contentEl.classList.remove("hidden");

  injectPostSEO(post);

  var bcPost = document.getElementById("bc-post");
  if (bcPost) bcPost.textContent = post.title;

  var heroImg = document.getElementById("post-hero-img");
  if (heroImg) {
    heroImg.src =
      post.image_url ||
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=80";
    heroImg.alt = post.image_alt || post.title;
    heroImg.onerror = function () {
      this.src =
        "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=80";
    };
  }

  var creditEl = document.getElementById("image-credit");
  if (creditEl) {
    if (post._image_source_url) {
      try {
        var host = new URL(post._image_source_url).hostname;
        if (host.startsWith("www.")) host = host.substring(4);
        creditEl.innerHTML =
          '<a href="' +
          escapeHtml(post._image_source_url) +
          '" target="_blank" rel="noopener nofollow" class="bg-black/60 hover:bg-black/80 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm transition-colors cursor-pointer border border-white/20">Fuente: ' +
          escapeHtml(host) +
          "</a>";
        creditEl.classList.remove("hidden");
      } catch (e) {
        creditEl.classList.add("hidden");
      }
    } else {
      creditEl.classList.add("hidden");
    }
  }

  var tf = [
    ["post-title", post.title],
    ["post-subtitle", post.subtitle],
    ["post-description-text", post.description],
    ["post-category", post.category],
    ["post-region", post.region],
    ["post-reading-time", post.reading_time],
    ["post-date", post.date_published],
    ["post-source", post.source],
  ];
  tf.forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    if (el && pair[1]) {
      el.textContent = pair[1];
      var parent = el.closest("[data-optional]");
      if (parent) parent.classList.remove("hidden");
    }
  });

  var contentBody = document.getElementById("post-content-body");
  if (contentBody && post.content) {
    contentBody.innerHTML = post.content;
  }

  var faqsEl = document.getElementById("post-faqs");
  if (faqsEl && post.faqs && post.faqs.length > 0) {
    faqsEl.innerHTML =
      '<div class="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden mt-6">' +
      '<div class="bg-gradient-to-r from-[#0033A0] to-[#001f6e] px-5 py-4">' +
      '<h2 class="text-white font-bold text-base">\u2753 Preguntas Frecuentes</h2>' +
      "</div>" +
      '<div class="divide-y divide-gray-100">' +
      post.faqs
        .map(function (faq) {
          return (
            '<details class="group px-5 py-4 cursor-pointer">' +
            '<summary class="font-semibold text-gray-800 text-sm list-none flex items-center justify-between gap-2">' +
            "<span>" +
            escapeHtml(faq.q) +
            "</span>" +
            '<span class="text-[#0033A0] font-bold text-lg flex-shrink-0">+</span>' +
            "</summary>" +
            '<p class="text-gray-600 text-sm mt-2 leading-relaxed">' +
            escapeHtml(faq.a) +
            "</p>" +
            "</details>"
          );
        })
        .join("") +
      "</div></div>";
    faqsEl.classList.remove("hidden");
  }

  var relatedEl = document.getElementById("post-related-recipes");
  if (relatedEl && post.region) {
    var recipes = await loadRecipes();
    var related = recipes
      .filter(function (r) {
        return r.region === post.region;
      })
      .slice(0, 3);
    if (related.length > 0) {
      relatedEl.innerHTML =
        '<div class="mt-8">' +
        '<h3 class="font-bold text-gray-800 text-base mb-4">\uD83C\uDF7D\uFE0F Recetas de ' +
        escapeHtml(post.region) +
        "</h3>" +
        '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">' +
        related.map(renderCard).join("") +
        "</div></div>";
      relatedEl.classList.remove("hidden");
    }
  }

  initAds();
}

// ─── Blog preview en index ─────────────────────────────────────
async function loadBlogPreview() {
  var grid = document.getElementById("blog-preview-grid");
  if (!grid) return;
  var posts = await loadPosts();
  if (posts.length === 0) {
    grid.innerHTML =
      '<div class="col-span-full text-center py-12 text-gray-400">' +
      '<p class="font-medium">Pr\u00f3ximamente: art\u00edculos de turismo</p></div>';
    return;
  }
  grid.innerHTML = posts.slice(0, 3).map(renderBlogCard).join("");
}

// ─── Página: MENÚ SEMANAL ─────────────────────────────────────
async function initMenuSemanal() {
  var recipes = await loadRecipes();
  var grid = document.getElementById("menu-grid");
  var regenBtn = document.getElementById("menu-regen");
  if (!grid) return;

  var DAYS = [
    "Lunes",
    "Martes",
    "Mi\u00e9rcoles",
    "Jueves",
    "Viernes",
    "S\u00e1bado",
    "Domingo",
  ];
  var DAY_EMOJIS = [
    "\uD83C\uDF31",
    "\uD83C\uDF72",
    "\uD83C\uDF5B",
    "\uD83C\uDF7D\uFE0F",
    "\uD83E\uDD57",
    "\uD83C\uDF89",
    "\u2728",
  ];

  function pickMenu() {
    var mains = recipes.filter(function (r) {
      return (
        !r.category ||
        [
          "Platos Fuertes",
          "Sopas",
          "Mariscos",
          "Desayunos",
          "Entradas",
        ].indexOf(r.category) !== -1
      );
    });
    var desserts = recipes.filter(function (r) {
      return r.category === "Postres";
    });
    var shuffled = mains.slice().sort(function () {
      return Math.random() - 0.5;
    });
    var dessertShuffled = desserts.slice().sort(function () {
      return Math.random() - 0.5;
    });

    var result = [];
    for (var i = 0; i < 7; i++) {
      if ((i === 5 || i === 6) && dessertShuffled.length > 0) {
        result.push(
          dessertShuffled.shift() || shuffled[i % shuffled.length] || null,
        );
      } else {
        result.push(shuffled[i % shuffled.length] || null);
      }
    }
    return result;
  }

  function renderMenu() {
    var menu = pickMenu();
    if (recipes.length === 0) {
      grid.innerHTML =
        '<div class="col-span-full text-center py-16 text-gray-400">' +
        '<div class="text-5xl mb-4">\uD83D\uDCC5</div>' +
        '<p class="text-lg font-medium">Pronto publicaremos el men\u00fa semanal</p>' +
        "</div>";
      return;
    }
    grid.innerHTML = DAYS.map(function (day, i) {
      var r = menu[i];
      if (!r)
        return (
          '<div class="bg-white rounded-3xl shadow-md p-5 text-center text-gray-400 border border-gray-100">' +
          '<p class="font-bold">' +
          DAY_EMOJIS[i] +
          " " +
          day +
          "</p>" +
          '<p class="text-sm mt-2">Sin receta</p></div>'
        );
      var img =
        r.image_url ||
        "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=70";
      return (
        '<a href="recipe.html?slug=' +
        encodeURIComponent(r.slug) +
        '"' +
        ' class="group bg-white rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 overflow-hidden block">' +
        '<div class="relative h-36 overflow-hidden">' +
        '<img src="' +
        escapeHtml(img) +
        '" alt="' +
        escapeHtml(r.title) +
        '"' +
        ' class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy">' +
        '<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>' +
        '<div class="absolute top-3 left-3 bg-[#0033A0] text-white text-xs font-bold px-2.5 py-1 rounded-full">' +
        DAY_EMOJIS[i] +
        " " +
        day +
        "</div>" +
        "</div>" +
        '<div class="p-4">' +
        '<p class="font-bold text-gray-900 text-sm leading-snug group-hover:text-[#0033A0] transition-colors">' +
        escapeHtml(r.title) +
        "</p>" +
        (r.total_time
          ? '<p class="text-xs text-gray-400 mt-1">\u23f1 ' +
          escapeHtml(r.total_time) +
          "</p>"
          : "") +
        (r.region
          ? '<p class="text-xs text-[#0033A0] mt-1 font-medium">' +
          escapeHtml(r.region) +
          "</p>"
          : "") +
        "</div>" +
        "</a>"
      );
    }).join("");
    initAds();
  }

  renderMenu();
  if (regenBtn) {
    regenBtn.addEventListener("click", function () {
      grid.innerHTML = renderSkeleton(7);
      setTimeout(renderMenu, 300);
    });
  }
}

// ─── Valoración con estrellas (localStorage) ──────────────────
var RATING_LABELS = [
  "",
  "Mala \u2639\uFE0F",
  "Regular \uD83D\uDE10",
  "Buena \uD83D\uDE42",
  "\u00A1Muy buena! \uD83D\uDE04",
  "\u00A1Excelente! \uD83E\uDD29",
];

function initRating(slug) {
  var picker = document.getElementById("star-picker");
  var label = document.getElementById("rating-label");
  if (!picker || !slug) return;

  var storageKey = "rating_" + slug;
  var saved = parseInt(localStorage.getItem(storageKey) || "0", 10);
  var stars = picker.querySelectorAll(".star-btn");

  function setDisplay(val) {
    stars.forEach(function (btn, i) {
      btn.innerHTML = i < val ? "\u2605" : "\u2606";
      btn.style.color = i < val ? "#FBBF24" : "#9CA3AF";
    });
    if (label) label.textContent = val > 0 ? RATING_LABELS[val] : "";
  }

  setDisplay(saved);

  stars.forEach(function (btn) {
    var v = parseInt(btn.dataset.star, 10);
    btn.addEventListener("mouseenter", function () {
      setDisplay(v);
    });
    btn.addEventListener("mouseleave", function () {
      setDisplay(parseInt(localStorage.getItem(storageKey) || "0", 10));
    });
    btn.addEventListener("click", function () {
      localStorage.setItem(storageKey, v);
      setDisplay(v);
      trackEvent("recipe_rating", { slug: slug, stars: v });
    });
  });
}

// ─── Router ───────────────────────────────────────────────────
(function router() {
  // i18n
  initI18n();

  const path = window.location.pathname.replace(/^\/|\.html$/g, '') || 'index';

  if (path === 'index' || path === '') {
    initIndex();
    loadBlogPreview();
  } else if (path === 'recipes') {
    initListing();
  } else if (path === 'recipe') {
    initRecipe();
  } else if (path === 'blog') {
    initBlog();
  } else if (path === 'post') {
    initPost();
  } else if (path === 'menu-semanal') {
    initMenuSemanal();
  }
})();
