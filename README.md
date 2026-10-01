# venzora-customer

Customer-facing storefront for the Venzora backend (Angular 21, SSR-capable). The back office is the sibling
`venzora-manager` project; both share `src/lib`.

- `npm run watch:dev` — dev server on 4200 (backend expected on 8085)
- `npm run build` — production build to `dist/venzora-customer`
- `npm run e2e` — Playwright smoke against the running dev server (`E2E_BASE_URL` to override)

Pages: `/home` (published storefront), `/pages/:slug`, `/products`, `/products/:id`, `/cart`, `/checkout`,
`/orders`, `/orders/:id`, `/login`, `/setting/account`, `/maintenance`.
See `.claude/memory.md` for the project notes and `document/api-docs` for the backend contract.
