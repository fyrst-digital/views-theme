# Product reviews

Theme-owned PDP reviews tab: summary, matrix filter, list island, write/edit form. Core storefront review plugins / `FormAjaxSubmit` / `js-review-container` are **not** used.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/review/review.html.twig` → `Review:Panel` (strips offcanvas chrome) |
| `Review:Panel` | Class VM + **owner JS**: URL SoT, Results XHR, form mode, save |
| `Review:Results` | XHR-swappable island (toolbar, items, pagination) |
| `Review:Summary` / `Matrix` / `Teaser` | Aside chrome + points control + write CTA |
| `Review:Item` | Single review card |
| `Review:Form` / `Form:Rating` / `Login` | Create/edit + star picker + account login |
| `Review:Rating` | Display-only stars leaf (also buy-box / product card) |
| Controllers | `ReviewController` — `/vi/product/{id}/reviews` list + save |
| Gateway | `ProductReviewGateway` → core `AbstractProductReviewLoader` (+ points URL normalize) |
| Core business APIs | `AbstractProductReviewSaveRoute` (validate/persist only) |

Theme does **not** reimplement review eligibility, moderation, or Store-API domain rules.

## Composition

```
Review:Panel (data-component owner)
├─ Summary
├─ Matrix          ← control: points[]
├─ Teaser          ← open/close form mode
└─ Main
     ├─ alerts
     ├─ form region → Form | Login
     └─ list region → Review:Results (island)
          ├─ Language (control: language)
          ├─ Sort (control: sort)
          ├─ counter
          ├─ Item × N
          └─ Pagination (ownerComponent = Review:Panel)
```

## URL query = filter SoT

Param names match core `ProductReviewLoader` (CMS SSR already loads via request):

| Param | Role |
|-------|------|
| `p` | page |
| `sort` | `createdAt` \| `points` |
| `language` | `filter-language` when on |
| `points` | multi — public URL uses `points[]=` (PHP list); scalar / pipe-joined also accepted |

- Owner `apply` → build params → GET Results HTML → swap island → **pushState** → hydrate controls from request params
- `popstate` → hydrate + fetch (no double push)
- Full page load with query restores filters via CMS resolver + loader
- **SSR note:** core loader only filters when `points` is a **list**. `ReviewPointsNormalizer` (+ `ReviewRequestSubscriber`) coerces scalar/`points[]`/pipe forms on the **query** bag only (never POST body — save needs scalar `points`)
- **Save form values:** controller passes plain `formValues` array into Panel/Form (never `RequestDataBag`); violation re-render keeps submitted scalars + `formViolations`
- Form open / success alerts are **local UI state** (not URL), except post-save HTML replace

## Controllers

| Route | Path | Response |
|-------|------|----------|
| `frontend.views-theme.review.list` | `GET /vi/product/{productId}/reviews` | HTML `Review:Results` |
| `frontend.views-theme.review.save` | `POST /vi/product/{productId}/reviews` | HTML full `Review:Panel` |

After load: fire `ProductReviewsWidgetLoadedHook` (App parity).  
Save: call `AbstractProductReviewSaveRoute` only; on violations re-render form with `formViolations` + plain `formValues` array (never `RequestDataBag`) + `mode=form`; on success reload + alert.

Render via `AbstractComponentController::renderComponent()`.

Query also carries `parentId` when needed (variant products).

## Owner JS (`Review/Panel.js`)

| API | Role |
|-----|------|
| `apply(patch, { pushHistory, resetPage })` | Results XHR + history |
| `syncControls` / `refreshControls` / `hydrateFromUrl` | Control registry |
| `openForm` / `closeForm` | Toggle form ↔ list regions |
| `save(FormData)` | POST save → replace Panel root |

Modules under `@views-theme/modules/review/` (+ shared helpers):

| Module | Role |
|--------|------|
| `params.js` | merge / URL parse (`points[]`); re-exports `objectOption` / `collectControlValues` from `shared/object-option` |
| `history.js` | thin wrapper → `shared/history` with review encode (`points[]`) |
| `fetch.js` | list GET + save POST (abort/seq) |
| `apply.js` | façade for controls → `Panel.apply` |

Domain stays isolated from `listing/*` — [javascript.md](../conventions/javascript.md).

Events: `ViewsTheme:Review:Loading`, `ViewsTheme:Review:Changed`, `ViewsTheme:Review:Mode`.

Controls call Panel only via `@views-theme/modules/review/apply.js` — not raw listing internals.

## Related leaves

| Component | Notes |
|-----------|--------|
| `Review:Rating` | Display stars; class VM builds `starIcons` |
| `Form:Textarea` | Shared primitive (title/content style parity with `Form:Input`) |
| `Form:Switch` / `Form:Select` / `Form:Input` | Language, sort, form fields |
| `Account:Login` | Nested in `Review:Login` with PDP redirect |
| `Pagination` | `ownerComponent` prop targets Review:Panel on this page |

## Related

- [Buy container](buy-container.md) — `Product:Rating` summary (not the tab)
- [Product box](product-box.md) — card stars via `Review:Rating`
- [Form input](form-input.md) — field primitives
- [Architecture](../architecture.md) — `/vi/…` + App hooks
