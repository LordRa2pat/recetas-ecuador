# Guía Definitiva de Optimización para Ecuador a la Carta (ecuadoralacarta.com)

Esta guía detalla las implementaciones necesarias para elevar **Ecuador a la Carta** al nivel de las mejores plataformas de recetas del mundo (como NYT Cooking, AllRecipes o Tasty), enfocándose en UX/UI, funcionalidades premium, retención de usuarios y SEO técnico.

## 1. Funcionalidades "Premium" (Cook Mode & Herramientas)

Para que la página sea una herramienta interactiva y no solo un blog de lectura:

*   **Escalado Automático de Porciones:**
    *   **Acción:** Implementar un multiplicador (ej. botones `[ - ] 2 [ + ]` porciones) que ajuste matemáticamente las cantidades de todos los ingredientes en tiempo real.
    *   **Beneficio:** Facilita la vida del usuario que cocina para familias numerosas o para sí mismo.
*   **Modo "Cocinar" (Cook Mode - Anti-bloqueo de Pantalla):**
    *   **Acción:** Añadir un botón flotante o destacado al inicio de la receta llamado "Modo Preparación". Al activarlo:
        1. Utiliza la [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) para evitar que el celular se apague.
        2. Oculta distracciones (menús, banners) y muestra la receta paso a paso con fuentes extragrandes.
*   **Ingredientes Interactivos (Checkboxes):**
    *   **Acción:** Transformar la lista estática de ingredientes en una lista de tareas (check-list).
    *   **Beneficio:** El usuario puede ir marcando (tachando) lo que ya sacó de la despensa o lo que ya agregó a la olla.
*   **Conversor del Sistema de Medidas:**
    *   **Acción:** Botón toggle `[Métrico (g/ml)] / [Imperial (tazas/oz)]`. Esto expandiría el mercado a usuarios en EE. UU. (migrantes ecuatorianos o curiosos de la gastronomía).

## 2. Diseño y Experiencia de Usuario (UX/UI)

El diseño debe ser "Mobile-First" (prioridad a dispositivos móviles), ya que el 80% del tráfico de recetas se consume en la cocina desde un smartphone.

*   **La "Recipe Card" (Tarjeta de Receta) Inmediata:**
    *   **Acción:** Incluir el botón **"Saltar a la Receta" (Jump to Recipe)** justo debajo del título. Los usuarios de hoy evitan leer introducciones largas.
    *   **Diseño:** La tarjeta debe resumir: Tiempo total, Dificultad, Rendimiento (porciones) y Calorías/Costo (opcional) en íconos claros al inicio de la tarjeta.
*   **Fotografía de Alta Calidad:**
    *   **Acción:** Imagen principal inmensa y "apetitosa" (Hero Image).
    *   **Paso a paso:** Para técnicas complejas (ej. cómo armar una hallaca o envolver un tamal), incluir fotos o GIFs cortos entre los pasos.
*   **Navegación Amigable al Pulgar:**
    *   **Acción:** Botones y enlaces con áreas de impacto grandes (mínimo 44x44 píxeles).
    *   **Menú fijo (Sticky):** Una barra inferior o superior que acompañe al usuario al hacer scroll para guardar la receta o cambiar porciones.
*   **Modo Oscuro (Dark Mode):**
    *   **Acción:** Opción para cambiar la paleta a tonos oscuros, muy valorado para reducir el brillo en la cocina y ahorrar batería.

## 3. Retención de Usuarios y Comunidad

Transformar visitantes casuales en usuarios fieles:

*   **Mi Recetario (Guardados Favoritos):**
    *   **Acción:** Un icono de corazón (`♥`) en cada receta que permita al usuario crear colecciones (ej. "Desayunos Ecuatorianos", "Cenas Rápidas"). Requiere inicio de sesión (Google/Apple login).
*   **Reseñas Ricas (Rich Reviews) y Fotos de Usuarios:**
    *   **Acción:** Permitir comentarios estilo: "Le cambié el maní por almendras y quedó brutal" y dejar que los usuarios suban **fotos de sus propios resultados**. (El Social Proof o prueba social es clave).
*   **Integración de Lista del Mercado:**
    *   **Acción:** Botón de "Añadir ingredientes a la lista de compras" (puede monentizarse en el futuro afiliándose a supermercados locales como Supermaxi).

## 4. SEO Técnico y Rendimiento (Backend)

La base invisible que asegura que Google ame **Ecuador a la Carta**:

*   **Schema Markup de Recetas (JSON-LD):**
    *   **Acción CRÍTICA:** Implementar el marcado de datos estructurados para recetas. Esto es lo que permite que tus platos aparezcan en Google con la foto, las estrellitas doradas (rating) y el tiempo en los "Rich Snippets" (Resultados enriquecidos).
*   **Optimización Extrema de Velocidad (Core Web Vitals):**
    *   **Acción:** Convertir todas las imágenes a formatos de última generación (`WebP` o `AVIF`).
    *   **Lazy Loading:** Carga diferida de imágenes; que la foto del paso 5 no se cargue hasta que el usuario llegue a ella.
*   **Buscador Inteligente / Filtros:**
    *   **Acción:** Un buscador que permita filtrar por "Ingrediente que tengo" (ej. "Tengo plátano verde y queso, ¿qué hago?") o por necesidad dietética ("Sin gluten").

---

### Resumen del Plan de Acción Sugerido para Desarrollo

1.  **Fase 1 (SEO y UX Básica):** Auditar la velocidad actual, implementar el botón "Saltar a la Receta" y asegurar que el Schema de Google (JSON-LD) esté 100% perfecto para captar tráfico orgánico.
2.  **Fase 2 (Herramientas Core):** Desarrollar la Tarjeta de Receta interactiva (escalado de porciones, checkboxes de ingredientes).
3.  **Fase 3 (Retención):** Implementar el botón "Modo Cocinar" y el sistema de favoritos/colecciones de usuarios.
