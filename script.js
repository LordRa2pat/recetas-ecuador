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
  initMapNavigation();
  initCalentadoGenerator(recipes);

  // Chuchaqui Mode Implementation
  const chuchaquiBtn = document.getElementById("chuchaqui-btn");
  if (chuchaquiBtn) {
    chuchaquiBtn.addEventListener("click", () => {
      const chuchaquiRecipes = recipes.filter(r => r.is_chuchaqui);
      if (featuredGrid) {
        featuredGrid.innerHTML = chuchaquiRecipes.map(renderCard).join("");
        // Visual Feedback
        chuchaquiBtn.classList.toggle('bg-ec-red/40');
        trackEvent("chuchaqui_mode_activated", { count: chuchaquiRecipes.length });
      }
    });
  }
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
    instList.innerHTML = recipe.instructions.map((inst, i) => {
      const stepVideo = (recipe.step_videos && recipe.step_videos[i]) ? `
        <div class="mt-8 rounded-3xl overflow-hidden shadow-2xl border border-white/5 aspect-video bg-black/20">
          <video src="${recipe.step_videos[i]}" autoplay loop muted playsinline class="w-full h-full object-cover"></video>
        </div>` : "";

      return `
        <li class="grid md:grid-cols-[80px_1fr] gap-8 group instruction-line" data-aos="fade-up">
          <div class="flex flex-col items-center">
             <span class="w-12 h-12 rounded-xl border border-ec-gold/20 flex items-center justify-center text-ec-gold font-display font-black italic text-xl group-hover:scale-110 transition-all">${i + 1}</span>
          </div>
          <div>
            <p class="text-white/60 text-xl font-light leading-relaxed tracking-tight group-hover:text-white transition-colors text-balance">${escapeHtml(inst)}</p>
            ${stepVideo}
          </div>
        </li>
      `;
    }).join("");
  }

  // Extra Cards
  renderVideosCard(recipe);
  renderFaqsSection(recipe);
  initRating(slug);
  initFavoritesAndSticky(recipe);
  initAds();
  initGlossary();
  initSpotifyPlayer(recipe);
  initSpicySlider(recipe);
  initCalculator(recipe);
  initMarketChecklist(recipe);
  initHandsDirtyMode();
  initAltitudeTimer();
  calculateEstimatedPrice(recipe);
  initB2BCalculator(recipe);
  initGamification();
  initYapaFeature(recipe);
  initPairingAndHuecas(recipe);
  initFlavorProfile(recipe);

  // Diaspora Mode Reactive Logic
  const diasporaSwitch = document.getElementById("diaspora-switch");
  if (diasporaSwitch) {
    diasporaSwitch.addEventListener("change", (e) => {
      const active = e.target.checked;
      const ingList = document.getElementById("ingredients-list");

      if (ingList && recipe.ingredients) {
        let displayIngredients = [...recipe.ingredients];

        if (active && recipe.diaspora_substitutes) {
          recipe.diaspora_substitutes.forEach(sub => {
            displayIngredients = displayIngredients.map(ing => {
              if (ing.includes(sub.original)) {
                return `${sub.substitute} (${sub.notes})`;
              }
              return ing;
            });
          });
        }

        ingList.innerHTML = displayIngredients.map(ing => `
              <li class="flex items-start gap-4 text-white/40 hover:text-white transition-colors group cursor-default">
                <span class="w-1.5 h-1.5 rounded-full bg-ec-gold group-hover:scale-150 transition-transform mt-2"></span>
                <span class="text-sm tracking-[0.05em] font-light italic">${escapeHtml(ing)}</span>
              </li>
          `).join("");

        trackEvent("diaspora_mode_toggle", { enabled: active, recipe: recipe.slug });
      }
    });
  }
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
    initHomeAds();
    initMenuPlanner();
    initDigitalStore();
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

// ─── Diccionario de la Abuela (Tooltips) ──────────────────────
async function initGlossary() {
  try {
    const response = await fetch('glossary.json');
    const glossary = await response.json();

    // Escanear ingredientes e instrucciones
    const containers = [
      document.getElementById("ingredients-list"),
      document.getElementById("instructions-list"),
      document.getElementById("recipe-description")
    ];

    containers.forEach(container => {
      if (!container) return;

      let html = container.innerHTML;
      // Ordenamos los términos por longitud (descendente) para evitar colisiones (ej. "achiote" vs "achi")
      const sortedKeys = Object.keys(glossary).sort((a, b) => b.length - a.length);

      sortedKeys.forEach(key => {
        const item = glossary[key];
        // Solo reemplazar texto que no esté ya dentro de una etiqueta glossary-term
        const regex = new RegExp(`\\b(${item.term})\\b(?![^<]*>|[^<>]*<\/span>)`, 'gi');
        html = html.replace(regex, `<span class="glossary-term cursor-help border-b border-dotted border-ec-gold/50 hover:text-ec-gold transition-all" data-term="${key}">$1</span>`);
      });
      container.innerHTML = html;
    });

    // Event listener para tooltips (Simplificado para V3.0)
    document.querySelectorAll('.glossary-term').forEach(el => {
      el.addEventListener('click', (e) => {
        const key = e.target.getAttribute('data-term');
        const item = glossary[key];
        alert(`${item.term}: ${item.definition}`); // Placeholder para modal ligero
      });
    });
  } catch (err) {
    console.warn("Glosario no cargado:", err);
  }
}

// ─── Mapa Gastronómico Interactivo ──────────────────────────
async function initMapNavigation() {
  const wrapper = document.getElementById("ecuador-map-wrapper");
  if (!wrapper) return;

  try {
    const response = await fetch('mapa.svg');
    const svgText = await response.text();
    wrapper.innerHTML = svgText; // Cambiado a innerHTML para renderizado correcto

    const regions = wrapper.querySelectorAll('.region-path');
    regions.forEach(path => {
      path.addEventListener('click', () => {
        const region = path.getAttribute('data-region');
        window.location.href = `recipes.html?region=${encodeURIComponent(region)}`;
      });
    });
  } catch (err) {
    console.error("Error al cargar mapa:", err);
  }
}

// ─── Playlists para Cocinar (Spotify) ──────────────────────
function initSpotifyPlayer(recipe) {
  const container = document.getElementById("spotify-player-container");
  if (!container || !recipe.spotify_playlist_id) return;

  container.innerHTML = `
    <iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/${recipe.spotify_playlist_id}?utm_source=generator&theme=0" width="100%" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
  `;
}

// ─── Nivel de Ají Visual ───────────────────────────────────
function initSpicySlider(recipe) {
  const slider = document.getElementById("spicy-slider");
  const valDisplay = document.getElementById("spicy-value");
  if (!slider || !valDisplay) return;

  slider.addEventListener("input", (e) => {
    const val = e.target.value;
    const labels = ["", "Suave", "Medio", "Picante", "Fuego", "Explosivo"];
    valDisplay.textContent = `Nivel ${val}: ${labels[val]}`;

    // Visual mutation (ej. cambiar color del slider o inyectar emojis de fuego)
    if (val >= 4) valDisplay.classList.add('text-ec-red');
    else valDisplay.classList.remove('text-ec-red');

    trackEvent("spicy_level_change", { level: val, recipe: recipe.slug });
  });
}

// ─── Generador de Calentado (Buscador Inverso) ─────────────
function initCalentadoGenerator(recipes) {
  const input = document.getElementById("calentado-input");
  const btn = document.getElementById("calentado-btn");
  const results = document.getElementById("calentado-results");

  if (!btn || !input || !results) return;

  btn.addEventListener("click", () => {
    const query = input.value.toLowerCase().trim();
    if (!query) return;

    // Algoritmo de coincidencia parcial
    const matches = recipes.filter(r => {
      const allText = (r.ingredients.join(" ") + " " + r.title + " " + r.description).toLowerCase();
      return query.split(/[\s,]+/).some(q => q.length > 2 && allText.includes(q));
    });

    if (matches.length > 0) {
      results.innerHTML = matches.slice(0, 2).map(r => `
        <a href="recipe.html?slug=${encodeURIComponent(r.slug)}" class="flex items-center gap-6 p-6 glass-card rounded-3xl border border-white/5 hover:border-ec-gold/30 transition-all group">
          <div class="w-20 h-20 rounded-2xl overflow-hidden shadow-xl">
            <img src="${r.image_url || 'images/default-recipe.jpg'}" class="w-full h-full object-cover group-hover:scale-110 transition-transform">
          </div>
          <div>
            <p class="text-[8px] font-black text-ec-gold uppercase tracking-[0.3em] mb-1">Coincidencia Hallada</p>
            <h4 class="text-white font-bold text-sm uppercase italic">${r.title}</h4>
          </div>
        </a>
      `).join("");
      trackEvent("calentado_search_success", { query, count: matches.length });
    } else {
      results.innerHTML = `<p class="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] col-span-2 text-center p-8 border border-dashed border-white/5 rounded-3xl italic">Archivos insuficientes. Prueba con otros ingredientes.</p>`;
    }
  });
}

// ─── Calculadora Épica de Fanesca (Escalador Inteligente) ──
function initCalculator(recipe) {
  const minus = document.getElementById("portion-minus");
  const plus = document.getElementById("portion-plus");
  const countDisplay = document.getElementById("portion-count");
  const ingList = document.getElementById("ingredients-list");

  if (!minus || !plus || !recipe.ingredients) return;

  // Extraer base servings de '6 personas' -> 6
  const baseServings = parseInt(recipe.servings) || 4;
  let currentServings = baseServings;
  countDisplay.textContent = currentServings;

  const updateIngredients = (newServings) => {
    const ratio = newServings / baseServings;

    const scaledIngredients = recipe.ingredients.map(ing => {
      // RegEx para detectar números al inicio
      const match = ing.match(/^([\d.,/]+)\s*(.*)$/);
      if (match) {
        let val = parseFloat(match[1].replace(',', '.'));
        if (isNaN(val)) return ing;

        // LÓGICA NO LINEAL: Las especias y sal crecen más lento
        // Si el ratio > 2, reducimos el crecimiento de condimentos
        const condimentos = ['sal', 'pimienta', 'comino', 'especia', 'ajos', 'achiote'];
        let factor = ratio;
        if (ratio > 2 && condimentos.some(c => ing.toLowerCase().includes(c))) {
          factor = 1 + (ratio - 1) * 0.7; // Crecimiento al 70% para especias
        }

        const newVal = (val * factor).toFixed(2).replace(/\.00$/, '');
        return `${newVal} ${match[2]}`;
      }
      return ing;
    });

    if (ingList) {
      ingList.innerHTML = scaledIngredients.map(ing => `
          <li class="flex items-start gap-4 text-white/40 hover:text-white transition-colors group cursor-default">
            <span class="w-1.5 h-1.5 rounded-full bg-ec-gold group-hover:scale-150 transition-transform mt-2"></span>
            <span class="text-sm tracking-[0.05em] font-light italic">${escapeHtml(ing)}</span>
          </li>
       `).join("");
    }
  };

  minus.addEventListener("click", () => {
    if (currentServings > 1) {
      currentServings--;
      countDisplay.textContent = currentServings;
      updateIngredients(currentServings);
    }
  });

  plus.addEventListener("click", () => {
    currentServings++;
    countDisplay.textContent = currentServings;
    updateIngredients(currentServings);
  });
}

// ─── Checklist de Mercado (WhatsApp) ───────────────────────
function initMarketChecklist(recipe) {
  const btn = document.getElementById("market-checklist-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const servings = document.getElementById("portion-count").textContent;
    const ingredients = Array.from(document.querySelectorAll("#ingredients-list li")).map(li => li.innerText).join('\n- ');

    const text = `🇪🇨 *LISTA DE COMPRA: ${recipe.title.toUpperCase()}*\n\nPara ${servings} personas:\n\n- ${ingredients}\n\n_Vía Ecuador a la Carta_`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    trackEvent("market_checklist_shared", { recipe: recipe.slug, servings });
  });
}

// ─── Modo Manos Sucias (Wake Lock API) ────────────────────
async function initHandsDirtyMode() {
  const switchEl = document.getElementById("hands-dirty-switch");
  if (!switchEl) return;

  let wakeLock = null;

  switchEl.addEventListener("change", async (e) => {
    if (e.target.checked) {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log("Wake Lock Is Active");
        } else {
          alert("Tu navegador no soporta Wake Lock. Mantén la pantalla encendida manualmente.");
        }
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    } else {
      if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
        console.log("Wake Lock Released");
      }
    }
  });
}

// ─── Temporizador de Altitud ──────────────────────────────
function initAltitudeTimer() {
  const display = document.getElementById("altitude-timer-display");
  const sierraBtn = document.getElementById("timer-sierra");
  const costaBtn = document.getElementById("timer-costa");
  const startBtn = document.getElementById("timer-start");

  if (!display || !startBtn) return;

  let timeLeft = 0;
  let timerId = null;

  const updateDisplay = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  sierraBtn?.addEventListener("click", () => {
    timeLeft = 600; // 10 min (ebullición sierra)
    updateDisplay();
    sierraBtn.classList.replace('bg-luxury-dark/20', 'bg-luxury-dark');
    costaBtn?.classList.replace('bg-luxury-dark', 'bg-luxury-dark/20');
  });

  costaBtn?.addEventListener("click", () => {
    timeLeft = 300; // 5 min (ebullición costa)
    updateDisplay();
    costaBtn.classList.replace('bg-luxury-dark/20', 'bg-luxury-dark');
    sierraBtn?.classList.replace('bg-luxury-dark', 'bg-luxury-dark/20');
  });

  startBtn.addEventListener("click", () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      startBtn.textContent = "ACTIVAR EBULLICIÓN";
    } else {
      if (timeLeft <= 0) return alert("Selecciona Sierra o Costa primero");
      timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft <= 0) {
          clearInterval(timerId);
          timerId = null;
          alert("¡TIEMPO DE EBULLICIÓN CUMPLIDO!");
        }
      }, 1000);
      startBtn.textContent = "DETENER";
    }
  });
}

// ─── API de Precios Estimados (Simulación DB Local) ───────
async function calculateEstimatedPrice(recipe) {
  const priceBox = document.getElementById("recipe-price-box");
  if (!priceBox) return;

  try {
    const response = await fetch('price_db.json');
    const db = await response.json();
    let total = 0;

    recipe.ingredients.forEach(ing => {
      const lower = ing.toLowerCase();
      Object.keys(db).forEach(key => {
        if (lower.includes(key)) {
          total += db[key].price_min || 0;
        }
      });
    });

    if (total === 0) total = 5.75; // Fallback
    priceBox.textContent = `$ ${(total / 2).toFixed(2)} - $ ${total.toFixed(2)} USD`;
  } catch (err) {
    priceBox.textContent = "$ 4.50 - $ 8.00 USD";
  }
}

// ─── Calculadora para Emprendedores (B2B) ──────────────────
function initB2BCalculator(recipe) {
  const switchEl = document.getElementById("b2b-switch");
  const panel = document.getElementById("b2b-panel");
  const baseCostDisplay = document.getElementById("b2b-cost-base");
  const pvpDisplay = document.getElementById("b2b-pvp");

  if (!switchEl || !panel) return;

  switchEl.addEventListener("change", (e) => {
    panel.classList.toggle('hidden', !e.target.checked);
    if (e.target.checked) {
      // Cálculo simplificado para demostración
      const servingsCurrent = parseInt(document.getElementById("portion-count").textContent) || 4;
      const basePrice = 5.00 * (servingsCurrent / 4); // Estimación base
      const totalCost = basePrice + 1.50; // Insumos fijos
      const pvp = totalCost * 1.30; // 30% margen

      baseCostDisplay.textContent = `$ ${basePrice.toFixed(2)}`;
      pvpDisplay.textContent = `$ ${(pvp / servingsCurrent).toFixed(2)} c/u`;

      trackEvent("b2b_mode_activated", { recipe: recipe.slug });
    }
  });
}

// ─── Gamificación y Medallas ─────────────────────────────
function initGamification() {
  const container = document.getElementById("badges-container");
  const card = document.getElementById("achievements-card");
  if (!container || !card) return;

  // Sistema de persistencia simple
  let userStats = JSON.parse(localStorage.getItem('user_stats_v3')) || { cooking_sessions: 0, shared: 0 };
  userStats.cooking_sessions++;
  localStorage.setItem('user_stats_v3', JSON.stringify(userStats));

  const badges = [
    { id: 'apprentice', title: 'Novato', icon: '🐣', condition: userStats.cooking_sessions >= 1 },
    { id: 'chef', title: 'Master Chef', icon: '👨‍🍳', condition: userStats.cooking_sessions >= 5 },
    { id: 'sharer', title: 'Embajador', icon: '📢', condition: userStats.shared >= 1 }
  ];

  const unlocked = badges.filter(b => b.condition);
  if (unlocked.length > 0) {
    card.classList.remove('hidden');
    container.innerHTML = unlocked.map(b => `
      <div class="flex-shrink-0 flex flex-col items-center gap-2 p-3 glass-card rounded-2xl border border-ec-gold/20 min-w-[70px]">
        <span class="text-2xl">${b.icon}</span>
        <span class="text-[7px] font-black text-white/60 uppercase tracking-tighter">${b.title}</span>
      </div>
    `).join("");
  }
}

// ─── Sección "La Yapa" (Gated Content) ─────────────────────
function initYapaFeature(recipe) {
  const lock = document.getElementById("yapa-lock");
  const btn = document.getElementById("unlock-yapa-btn");
  const content = document.getElementById("yapa-content");

  if (!lock || !btn || !content) return;

  // El secreto viene de los metadatos o fallback
  content.textContent = recipe.tips ? recipe.tips[0] : "Agrega una pizca de achiote al final para un brillo real.";

  btn.addEventListener("click", () => {
    // Simular compartir
    lock.classList.add('opacity-0', 'pointer-events-none');
    trackEvent("yapa_unlocked", { recipe: recipe.slug });

    // Actualizar medallas por compartir
    let stats = JSON.parse(localStorage.getItem('user_stats_v3')) || { cooking_sessions: 0, shared: 0 };
    stats.shared++;
    localStorage.setItem('user_stats_v3', JSON.stringify(stats));
    initGamification(); // Refresh badges
  });
}

// ─── Maridaje y Integración de "Huecas" ────────────────────
function initPairingAndHuecas(recipe) {
  const pairingIcon = document.getElementById("pairing-icon");
  const pairingTitle = document.getElementById("pairing-title");
  const huecasLink = document.getElementById("huecas-link");

  if (pairingTitle) {
    const drinks = [
      { name: "Chicha de Jora", icon: "🍶" },
      { name: "Canelazo", icon: "☕" },
      { name: "Horchata Lojana", icon: "🌸" },
      { name: "Jugo de Naranjilla", icon: "🍹" }
    ];
    const drink = drinks[Math.floor(Math.random() * drinks.length)];
    pairingTitle.textContent = drink.name;
    pairingIcon.textContent = drink.icon;
  }

  if (huecasLink) {
    const searchUrl = `https://www.google.com/maps/search/restaurantes+de+${encodeURIComponent(recipe.title)}+cerca+de+mi`;
    huecasLink.href = searchUrl;
  }
}

// ─── Sección "La Yapa" (Gated Content) ─────────────────────
function initYapaFeature(recipe) {
  const lock = document.getElementById("yapa-lock");
  const btn = document.getElementById("unlock-yapa-btn");
  const content = document.getElementById("yapa-content");

  if (!lock || !btn || !content) return;

  content.textContent = recipe.tips ? recipe.tips[0] : "Agrega una pizca de achiote al final para un brillo real.";

  btn.addEventListener("click", () => {
    lock.classList.add('opacity-0', 'pointer-events-none');
    trackEvent("yapa_unlocked", { recipe: recipe.slug });

    let stats = JSON.parse(localStorage.getItem('user_stats_v3')) || { cooking_sessions: 0, shared: 0 };
    stats.shared++;
    localStorage.setItem('user_stats_v3', JSON.stringify(stats));
    initGamification();
  });
}

// ─── Maridaje y Integración de "Huecas" ────────────────────
function initPairingAndHuecas(recipe) {
  const pairingIcon = document.getElementById("pairing-icon");
  const pairingTitle = document.getElementById("pairing-title");
  const huecasLink = document.getElementById("huecas-link");

  if (pairingTitle) {
    const drinks = [
      { name: "Chicha de Jora", icon: "🍶" },
      { name: "Canelazo", icon: "☕" },
      { name: "Horchata Lojana", icon: "🌸" },
      { name: "Jugo de Naranjilla", icon: "🍹" }
    ];
    const drink = drinks[Math.floor(Math.random() * drinks.length)];
    pairingTitle.textContent = drink.name;
    pairingIcon.textContent = drink.icon;
  }

  if (huecasLink) {
    const searchUrl = `https://www.google.com/maps/search/restaurantes+de+${encodeURIComponent(recipe.title)}+cerca+de+mi`;
    huecasLink.href = searchUrl;
  }
}

// ─── Perfil de Sabor (Infografía Dinámica) ────────────────
function initFlavorProfile(recipe) {
  const bars = {
    dulzor: document.getElementById("bitter-bar"),
    acidez: document.getElementById("acid-bar"),
    picante: document.getElementById("spicy-bar-infog"),
    umami: document.getElementById("umami-bar")
  };

  if (!bars.dulzor) return;

  const hash = recipe.slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  bars.dulzor.style.width = `${(hash % 100)}%`;
  bars.acidez.style.width = `${((hash * 7) % 100)}%`;
  bars.picante.style.width = `${(recipe.spicy_level * 20)}%`;
  bars.umami.style.width = `${((hash * 3) % 100)}%`;
}

// ─── Planificador de Menús Automatizado ───────────────────
function initMenuPlanner() {
  const btn = document.getElementById("menu-planner-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      const response = await fetch('recipes.json');
      const recipes = await response.json();
      const shuffled = [...recipes].sort(() => 0.5 - Math.random());
      const menu = shuffled.slice(0, 3);

      let html = `
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-luxury-dark/95 backdrop-blur-2xl">
          <div class="max-w-4xl w-full">
            <div class="flex justify-between items-center mb-12">
              <h2 class="text-white font-display font-black italic text-4xl uppercase tracking-tighter">Tu Menú del Día 🇪🇨</h2>
              <button onclick="this.closest('div.fixed').remove()" class="text-white/40 hover:text-white transition-all text-xl">✕</button>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
              ${menu.map((r, i) => `
                <a href="recipe.html?slug=${r.slug}" class="group glass-card p-6 rounded-[32px] border border-white/5 hover:border-ec-gold/30 transition-all">
                  <span class="text-[9px] font-black text-ec-gold uppercase tracking-[0.3em] mb-4 block">${i == 0 ? 'Entrada' : i == 1 ? 'Fuerte' : 'Postre'}</span>
                  <div class="aspect-square rounded-2xl overflow-hidden mb-6">
                    <img src="${r.image_url}" class="w-full h-full object-cover group-hover:scale-110 transition-transform">
                  </div>
                  <h3 class="text-white font-bold text-lg uppercase italic leading-none">${r.title}</h3>
                </a>
              `).join("")}
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);
    } catch (e) { }
  });
}

// ─── Tienda de Productos Digitales ───────────────────────
function initDigitalStore() {
  const footerIcons = document.querySelector('footer .flex.gap-3');
  if (footerIcons) {
    const shopBtn = document.createElement('a');
    shopBtn.href = "#";
    shopBtn.className = "w-10 h-10 rounded-xl bg-ec-gold/10 border border-ec-gold/20 flex items-center justify-center text-ec-gold hover:bg-ec-gold hover:text-luxury-dark transition-all text-sm";
    shopBtn.innerHTML = "🛒";
    shopBtn.title = "Tienda Digital (Próximamente)";
    shopBtn.onclick = (e) => {
      e.preventDefault();
      alert("🛍️ ¡Próximamente! Nuestra tienda de Masterclasses y PDFs está en construcción.");
    };
    footerIcons.appendChild(shopBtn);
  }
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
