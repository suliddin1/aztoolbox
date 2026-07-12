# AzToolBox

Zero-build, client-side utility platform redesigned around shared UI components.

## Run locally

```powershell
python -m http.server 8000
```

Open `http://127.0.0.1:8000`.

## Architecture

- `assets/css/tokens.css` — semantic Light/Dark design tokens
- `assets/css/app.css` — shared component and responsive styles
- `assets/js/components.js` — shared header, footer, global search, theme, favorites and recent history
- `assets/js/ambient-waves.js` — one optimized application-level Canvas wave system
- `assets/js/tools-data.js` — the real tool registry used by home, catalog, search and related tools
- `assets/js/app.js` — page controllers and client-side tool workflows
- `tools/` — searchable/filterable catalog
- `tool/` — reusable tool-page shell selected via `?slug=`
- `about/`, `privacy/`, `feedback/` — shared-shell content pages

## Included tools

The shared registry currently exposes 39 tools across PDF, image, text,
developer, calculation, security, and Azerbaijani-language categories.

All workflows run in the browser. `pdf-lib` and `qrcodejs` are vendored locally with their licenses.
