# Ismo Studios — migración a Astro

Sitio estático (SSG) de Ismo Studios migrado desde la versión vanilla
(HTML/CSS/JS) a **Astro 7**, con una estética editorial y oscura suave
inspirada en referencias de hotel boutique (contenido protagonista). El
proyecto original queda intacto en la carpeta raíz (`/home/kevinsrdev/Documentos/Ismo`)
como referencia.

## Comandos

| Comando             | Acción                                              |
| :------------------ | :--------------------------------------------------- |
| `npm install`       | Instala dependencias                                 |
| `npm run dev`       | Servidor de desarrollo en `localhost:4321`           |
| `npm run build`     | Build de producción a `./dist/`                      |
| `npm run preview`   | Sirve el build localmente antes de desplegar         |
| `npm run check`     | Chequeo de tipos de Astro                            |
| `npm run videos:build` | Re-genera los renditions WebM de los mp4 con ffmpeg |

### Lighthouse

```bash
npx lighthouse http://localhost:4321/ --budget-path=budget.json \
  --form-factor=mobile --screenEmulation.mobile --chrome-flags="--headless"
```

Validado con Lighthouse 13.4.1 en las tres rutas (build de producción):

| Ruta      | Perf | FCP    | LCP    | TBT | CLS |
| :-------- | :--- | :----- | :----- | :-- | :-- |
| `/`       | 98   | 1054ms | 1803ms | 0ms | 0.000 |
| `/fotos/` | 99   | 1056ms | 2255ms | 27ms | 0.000 |
| `/videos/`| 99   | 1055ms | 2256ms | 0ms | 0.000 |

Las tres rutas cumplen el budget definido en `budget.json` (timings y tamaños).

## Estructura

```
src/
├── layouts/BaseLayout.astro     # head común, ClientRouter, preloads, fuentes
├── pages/                       # index / fotos / videos (SSG puro)
├── components/                  # Header, NavBar, WelcomeIntro, Hero, About,
│                                # Clients, Footer, BackgroundVideo, SliderFotos,
│                                # PhotoLightbox, VideoGallery, VideoCard, VideoModal
├── styles/                      # fonts, base (tokens), header, motion, index,
│                                # sliders, videos
├── content.config.ts            # colecciones fotos + videos (schema con image())
├── content/
│   ├── fotos/*.yaml             # titulo/alt/slider(s1|s2|s3)/orden/imagen
│   └── videos/*.yaml            # titulo/video (mp4)/thumb
├── assets/
│   ├── img/     # fotografía original (JPG, nunca servida tal cual)
│   ├── thumbs/  # miniaturas de video (PNG, nunca servida tal cual)
│   ├── videos/  # mp4 originales + renditions WebM (-hd / -sd)
│   ├── bg/      # VideoFondo.webm (~1.5MB) + poster.webp optimizado
│   └── brand/   # logo_ismo.webp (10KB) y SVGs
└── (listo)      # scripts/build-videos.mjs (ffmpeg)
```

## Sistema de diseño

- **Dark suave**: `--bg: #101014` (negro no puro), superficies `#16161C/#1A1A22`,
  texto `#F4F4F7` (blanco hueso), secundario `#9C9CA6`, hairlines
  `rgba(244,244,247,.09)`.
- **Acento**: ámbar vivo `#F59A3E` (hover `#FFAD62`), con presencia en barra
  de progreso, contadores, hover de links y botones.
- **Tipografía**: titulares en **Bebas Neue** (condensada, un solo peso,
  licencia **OFL** — libre para uso comercial) + cuerpo en **Open Sans
  Variable** (local, `@fontsource`).
- **Editorial limpio**: sin kickers ni cabeceras numeradas ni etiquetas sobre
  los títulos; `display` con `clamp()`, layout convocado en `--shell`. Los
  fondos de About y Clientes usan `--bg-deep: #0d0d10` (20% más oscuro que
  el fondo de página) y permanecen siempre visibles (la animación de scroll
  afecta solo al contenido interno).

## Decisiones de rendimiento

- **JS por página** (transfer, minificado): home ≈7KB (ClientRouter + Esc del
  menú), /fotos ≈7KB (drag + flechas + barra de progreso/contador + lightbox),
  /videos ≈7KB (spotlight + modal + selector de calidad). Sin librerías
  externas; todos los módulos se re-inicializan en `astro:page-load`
  (compatibles con `ClientRouter`).
- **Imágenes**: AVIF (q55) + WebP (q70) con `getImage`, widths
  [480, 720, 960, 1280, 1600], `sizes` por slider, primera imagen `eager` +
  `fetchpriority="high"`, resto `lazy`. El JPG original nunca se sirve.
- **Lightbox**: reutiliza los srcset AVIF/WebP ya generados en las tarjetas
  (0 descargas extra, usa la caché); navegación por teclado, swipe y Esc.
- **Foto y video (calidad adaptativa)**: cada video genera renditions WebM VP9
  (`npm run videos:build`): `-hd` (~1.4Mbps) y `-sd` (~700kbps). El modal
  ofrece **Auto / Máxima (mp4) / HD / SD**; Auto decide por
  `navigator.connection` (saveData/2g/3g→SD, si no hay soporte WebM→Máxima,
  si no→HD) y la elección se persiste en `localStorage`.
- **Video de fondo**: vive en `BaseLayout` con `transition:persist`. Se pausa
  y oculta en `/fotos` y `/videos`; solo arranca tras `load` + idle/timer de
  3s en la home, si la pestaña está activa y la red no es lenta.
- **Fuentes**: preload de los 2 woff2 (Open Sans latin 48KB + Bebas Neue
  ~28KB ≈ **76KB**); `font-display: swap`. Sin Google Fonts.
- **View transitions**: `<ClientRouter />` + crossfade 0.4s; header persistente
  con `view-transition-name`.
- **Reduced motion**: bloque global en `motion.css` (0.01ms, sin intro, sin
  video de fondo, animaciones `appear` visibles).
- **Intro de bienvenida** (estilo preloader, ref. benjamincreative.me): 100%
  CSS (~2.05s). Wordmark "Ismo Studios" en Bebas Neue que escala 3.5→1 con
  easing elástico `cubic-bezier(0.96,-0.02,0.38,1.01)`, letras que suben con
  stagger, y dos cortinas ámbar (`#F59A3E` 95%) que se separan revelando la
  página. Solo se reproduce en una **carga fresca de la home** (flag
  `window.__ismoFreshHome` en `BaseLayout`); en navegaciones SPA (ClientRouter)
  se elimina sin reproducirse. El hero espera a que se abra la cortina
  (delays 1.9–2.35s) salvo que la intro se salte (red lenta / reduced-motion).
- **Responsive con rotación**: media query `@media (orientation: landscape)
  and (max-height: 520px)` ajusta hero, secciones, galería, menú y modal para
  teléfonos en horizontal (~360px de alto). Se usa `dvh` para que las alturas
  se recalculen al girar, con fallback `100vh`.

## Trabajo pendiente

- **Clientes**: la sección usa marcas tipográficas placeholder (`Marca 01…`).
  Sustituir el array `marcas` en `src/components/Clients.astro` por los
  clientes reales.
- **Alt/títulos**: revisar texto editorial de `src/content/` si el cliente
  quiere otro naming.
