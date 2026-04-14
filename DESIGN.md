# Hemanth's Entertainment Zone – Design System

> A premium dark-first streaming UI design language for HEZ.

---

## 1. Color Palette

### Core Surfaces

| Token             | Value                     | Usage                        |
|-------------------|---------------------------|------------------------------|
| `--bg`            | `#0f0f0f`                 | Body / page background       |
| `--bg-card`       | `#1a1a1a`                 | Cards, panels, drawers       |
| `--bg-elevated`   | `#242424`                 | Dropdowns, tooltips, modals  |
| `--bg-overlay`    | `rgba(0,0,0,0.75)`        | Modal scrim, player overlay  |

### Text

| Token               | Value                       | Usage                     |
|---------------------|-----------------------------|---------------------------|
| `--text-primary`    | `#ffffff`                   | Headings, labels          |
| `--text-secondary`  | `rgba(255,255,255,0.7)`     | Body copy, descriptions   |
| `--text-muted`      | `rgba(255,255,255,0.4)`     | Meta, timestamps, captions|

### Borders

| Token           | Value                     | Usage               |
|-----------------|---------------------------|---------------------|
| `--border`      | `rgba(255,255,255,0.08)`  | Card edges, dividers|
| `--border-muted`| `rgba(255,255,255,0.04)`  | Subtle separators   |

### Accent

| Token            | Value                     | Usage                              |
|------------------|---------------------------|------------------------------------|
| `--accent`       | `#e50914`                 | Primary CTAs, active states, brand |
| `--accent-hover` | `#ff0f1c`                 | Hover / focus on accent elements   |
| `--accent-muted` | `rgba(229,9,20,0.15)`     | Badge backgrounds, chip tints      |

---

## 2. Typography

**Font Family:** `Inter` (Google Fonts)  
**Fallback:** `system-ui, -apple-system, sans-serif`

| Role        | Size (rem) | Weight | Letter Spacing |
|-------------|-----------|--------|----------------|
| Hero Title  | 3.5       | 900    | −0.03em        |
| Section H2  | 1.25      | 700    | −0.02em        |
| Body        | 1.0       | 400    | 0              |
| Caption     | 0.75      | 500    | +0.02em        |
| Badge       | 0.7       | 700    | +0.05em        |

- **Line Height:** 1.6 for body, 1.2 for headings  
- **Anti-aliasing:** `webkit-font-smoothing: antialiased`

---

## 3. Spacing

Base unit = `4px`. Use multiples: `4, 8, 12, 16, 24, 32, 48, 64, 96`.

| Token | Value   |
|-------|---------|
| xs    | 4px     |
| sm    | 8px     |
| md    | 16px    |
| lg    | 24px    |
| xl    | 32px    |
| 2xl   | 48px    |
| 3xl   | 64px    |

---

## 4. Radius

| Token          | Value   | Usage                          |
|----------------|---------|--------------------------------|
| `--radius-sm`  | `6px`   | Inputs, buttons, tags          |
| `--radius-card`| `12px`  | Cards, poster thumbnails       |
| `--radius-pill`| `9999px`| Badges, chips, toggle switches |

---

## 5. Elevation / Shadows

| Token            | Value                            | Element      |
|------------------|----------------------------------|--------------|
| `--shadow-card`  | `0 4px 24px rgba(0,0,0,0.6)`    | Cards        |
| `--shadow-hover` | `0 8px 32px rgba(0,0,0,0.8)`    | Hovered cards|
| `--shadow-glow`  | `0 0 24px rgba(229,9,20,0.35)`  | Accent glow  |

---

## 6. Motion & Animation

| Name       | Duration | Easing                         | Use case               |
|------------|----------|--------------------------------|------------------------|
| `fadeIn`   | 0.45s    | `ease`                         | Page / section enter   |
| `scaleIn`  | 0.3s     | `ease`                         | Modal / card pop-in    |
| `shimmer`  | 2s ∞     | `linear`                       | Skeleton loading state |
| Hover lift | 0.2s     | `cubic-bezier(0.4,0,0.2,1)`   | Card translateY(-2px)  |
| Hover scale| 0.4s     | `ease`                         | Poster scale(1.04)     |

**Transition shorthand:** `all 0.2s cubic-bezier(0.4,0,0.2,1)`

---

## 7. Components

### Poster Card
```
aspect-ratio: 2/3 (portrait)
border-radius: var(--radius-card)
overflow: hidden
hover: scale(1.04) translateY(−4px) + glow shadow
overlay: gradient bottom revealing title + rating
```

### Navbar
```
height: 64px
position: fixed top
background: rgba(15,15,15,0.9) + backdropFilter: blur(16px)
border-bottom: 1px solid var(--border)
z-index: 50
```

### Hero Banner
```
height: min(88vh, 700px)
background: full-bleed backdrop image
overlay: left-side dark gradient + bottom fade
content: badge + h1 + overview + CTA buttons
```

### Button – Primary
```
background: var(--accent)
color: #fff
border-radius: var(--radius-sm)
padding: 0.625rem 1.25rem
hover: background var(--accent-hover) + shadow-glow + translateY(-1px)
```

### Button – Ghost
```
background: rgba(255,255,255,0.08)
border: 1px solid var(--border)
hover: background rgba(255,255,255,0.14)
```

### Badge / Pill
```
padding: 0.2rem 0.6rem
border-radius: var(--radius-pill)
font-size: 0.7rem, weight 700, UPPERCASE
accent variant: accent-muted bg + accent border
```

### Horizontal Scroll Row
```
display: flex; gap: 1rem; overflow-x: auto
scrollbar: hidden (webkit) + scrollbar-width: none
```

### Skeleton
```
background: linear-gradient(90deg, --bg-card, --bg-elevated, --bg-card)
background-size: 200%
animation: shimmer 2s infinite linear
```

### Player Wrapper
```
padding-top: 56.25%   ← 16:9 ratio trick
position: relative
iframe: absolute inset-0
border-radius: var(--radius-card)
```

---

## 8. Layout

### Container
```
max-width: 1440px; margin: auto
padding: 0 1.5rem  (mobile)
       → 0 2.5rem  (md)
       → 0 4rem    (xl)
```

### Navbar height clearance
```
margin-top: var(--navbar-height)  /* 64px */
```

---

## 9. Tailwind Dark Tokens (tailwind.config.ts)

```ts
colors: {
  bg: { DEFAULT: '#0f0f0f', card: '#1a1a1a', elevated: '#242424' },
  accent: { DEFAULT: '#e50914', hover: '#ff0f1c', muted: 'rgba(229,9,20,0.15)' },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255,255,255,0.7)',
    muted: 'rgba(255,255,255,0.4)',
  },
}
```

---

## 10. Streaming Embed (VidSrc / VidKing)

```
VidSrc movie:  https://vidsrc.to/embed/movie/{tmdb_id}
VidSrc TV:     https://vidsrc.to/embed/tv/{tmdb_id}/{season}/{episode}

VidKing movie: https://vidking.cc/embed/movie/{tmdb_id}
VidKing TV:    https://vidking.cc/embed/tv/{tmdb_id}/{season}/{episode}
```

Embed inside `.player-wrapper` using the 16:9 padding-top trick.  
`allowFullScreen`, `referrerpolicy="no-referrer"` recommended.

---

## 11. TMDB Metadata

Base URL: `https://api.themoviedb.org/3`  
Auth: `?api_key={TMDB_KEY}` or `Authorization: Bearer {token}`

Image CDN: `https://image.tmdb.org/t/p/{size}/{path}`

| Size    | Use            |
|---------|----------------|
| `w92`   | Thumbnail      |
| `w185`  | Small poster   |
| `w342`  | Card poster    |
| `w500`  | Detail poster  |
| `w780`  | Backdrop small |
| `w1280` | Backdrop HD    |
| `original` | Hero/full   |
