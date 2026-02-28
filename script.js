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

  // Mapeo a la nueva estructura V2.5
  var featuredGrid = document.getElementById("recipe-featured-grid");
  if (featuredGrid) {
    if (recipes.length > 0) {
      // Priorizar las que tengan imagen o video
      var sorted = recipes.slice().sort((a, b) => {
        const aHasImg = a.image_url || (a.youtube_videos && a.youtube_videos.length > 0);
        const bHasImg = b.image_url || (b.youtube_videos && b.youtube_videos.length > 0);
        return bHasImg - aHasImg;
      });
      featuredGrid.innerHTML = sorted.slice(0, 6).map(renderCard).join("");
    } else {
      renderEmptyState(featuredGrid, "Archivos cargando...");
    }
  }

  // Compatibilidad con secciones antiguas (si existen)
  var classics = recipes.filter(r => !r.target_audience || r.target_audience === "Local");
  var classicGrid = document.getElementById("classic-grid");
  if (classicGrid && classics.length > 0) {
    classicGrid.innerHTML = classics.slice(0, 6).map(renderCard).join("");
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
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const loadingEl = document.getElementById("recipe-loading");
  const errorEl = document.getElementById("recipe-error");
  const contentEl = document.getElementById("recipe-content");

  if (!slug) {
    if (loadingEl) loadingEl.classList.add("hidden");
    if (errorEl) errorEl.classList.remove("hidden");
    return;
  }

  const recipes = await loadRecipes();
  const recipe = recipes.find(r => r.slug === slug);

  if (!recipe) {
    if (loadingEl) loadingEl.classList.add("hidden");
    if (errorEl) errorEl.classList.remove("hidden");
    return;
  }

  if (loadingEl) loadingEl.classList.add("hidden");
  if (contentEl) {
    contentEl.classList.remove("hidden");
    contentEl.style.opacity = "1"; // For transition
  }

  injectSEO(recipe);

  // Sync breadcrumbs and title
  const bcRecipe = document.getElementById("bc-recipe");
  if (bcRecipe) bcRecipe.textContent = recipe.title;

  const titleEl = document.getElementById("recipe-title");
  if (titleEl) titleEl.textContent = recipe.title;

  const descEl = document.getElementById("recipe-description");
  if (descEl) descEl.textContent = recipe.description || "Receta tradicional de la gastronomía ecuatoriana, preservada en nuestros archivos maestros.";

  const catEl = document.getElementById("recipe-category");
  if (catEl) catEl.textContent = recipe.category || "General";

  const regEl = document.getElementById("recipe-region");
  if (regEl) regEl.textContent = recipe.region || "Ecuador";

  // Specs
  const specs = {
    "recipe-total-time": recipe.total_time || "-- min",
    "recipe-servings": recipe.servings || "-- per",
    "recipe-difficulty": recipe.difficulty || "Media"
  };
  for (const [id, val] of Object.entries(specs)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // Hero Image (Using the same logic as renderCard)
  const heroImg = document.getElementById("recipe-hero-img");
  if (heroImg) {
    let img = recipe.image_url || "";
    if (!img && recipe.youtube_videos && recipe.youtube_videos.length > 0) {
      const v = recipe.youtube_videos.find(x => !["KIWA", "KWA"].includes((x.channel || "").toUpperCase())) || recipe.youtube_videos[0];
      if (v && v.videoId) img = "https://img.youtube.com/vi/" + v.videoId + "/maxresdefault.jpg";
    }
    heroImg.src = img || "https://images.unsplash.com/photo-1547517023-7ca0c162f816?w=1200";
  }

  // Ingredients and Instructions (New containers)
  const ingList = document.getElementById("ingredients-list");
  if (ingList && recipe.ingredients) {
    ingList.innerHTML = recipe.ingredients.map(ing => `
          <li class="flex items-start gap-4 text-white/40 hover:text-white transition-colors group cursor-default">
            <span class="w-1.5 h-1.5 rounded-full bg-ec-gold group-hover:scale-150 transition-transform mt-2"></span>
            <span class="text-sm tracking-[0.05em] font-light italic">${escapeHtml(ing)}</span>
          </li>
      `).join("");
  }

  const instList = document.getElementById("instructions-list");
  if (instList && recipe.instructions) {
    instList.innerHTML = recipe.instructions.map((inst, i) => `
        <li class="grid md:grid-cols-[80px_1fr] gap-8 group instruction-line" data-aos="fade-up">
          <div class="flex flex-col items-center">
             <span class="w-12 h-12 rounded-xl border border-ec-gold/20 flex items-center justify-center text-ec-gold font-display font-black italic text-xl group-hover:scale-110 transition-all">${i + 1}</span>
          </div>
          <p class="text-white/60 text-xl font-light leading-relaxed tracking-tight group-hover:text-white transition-colors text-balance">${escapeHtml(inst)}</p>
        </li>
      `).join("");
  }

  // Extra Cards
  renderVideosCard(recipe);
  renderFaqsSection(recipe);
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
  initI18n();

  // Robust path detection for local and prod
  const pathname = window.location.pathname;
  const path = pathname.split('/').pop().replace(/\.html$/, '') || 'index';

  if (path === 'index' || pathname === '/') {
    initIndex();
    if (typeof loadBlogPreview === 'function') loadBlogPreview();
  } else if (path === 'recipes') {
    initListing();
  } else if (path === 'recipe') {
    initRecipe();
  } else if (path === 'blog') {
    if (typeof initBlog === 'function') initBlog();
  } else if (path === 'post') {
    if (typeof initPost === 'function') initPost();
  } else if (path === 'menu-semanal') {
    if (typeof initMenuSemanal === 'function') initMenuSemanal();
  }
})();
