# Product reviews

Theme-owned PDP reviews tab: summary, matrix filter, list island, write/edit form. Core storefront review plugins / `FormAjaxSubmit` / `js-review-container` are **not** used.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/review/review.html.twig` → `Review:Panel` (strips offcanvas chrome) |
| `Review:Panel` | Class VM + **owner JS**: URL SoT, Results XHR, form mode, save |
| `Review:Results` | XHR-swappable list island (toolbar, items, pagination); list region host |
| `Review:Sidebar` | Aside column: Summary + Matrix + Teaser |
| `Review:Summary` / `Teaser` | Counts chrome + write CTA; Summary rating host = stars + Average |
| `Review:Matrix` | Class VM points filter control (`points[]`); rows from matrix + URL SoT |
| `Review:Alerts` | Post-save / validation flash alerts |
| `Review:Item` | Single review card; owner row gets edit CTA (`editable`) |
| `Review:Form` | Class VM + region host: Login (guest) or create/edit fields |
| `Review:Form:Rating` / `Login` | Star picker + account login (Login nested under Form) |
| `Review:Rating` | Display stars leaf; also buy-box / product card |
| `Review:Average` | Text average (`points` / `maxPoints`); composed by Summary when `totalReviewCount > 0` |
| Controllers | `ReviewController` — `/vi/product/{id}/reviews` list + save |
| Gateway | `ProductReviewGateway` → core `AbstractProductReviewLoader` (+ points URL normalize) |
| Core business APIs | `AbstractProductReviewSaveRoute` (validate/persist only) |

Theme does **not** reimplement review eligibility, moderation, or Store-API domain rules.

## Composition

```
Review:Panel (data-component owner)
├─ Sidebar
│    ├─ Summary
│    │    ├─ title
│    │    └─ rating (DOM host)
│    │         ├─ Review:Rating
│    │         └─ Review:Average   ← when totalReviewCount > 0
│    ├─ Matrix          ← class VM; control: points[]
│    │    └─ Row × N
│    │         ├─ Check   ← nest `check`
│    │         ├─ Bar     ← nest `bar` (progress/fill)
│    │         └─ Share   ← nest `share`
│    └─ Teaser          ← open/close form mode
└─ Main
     ├─ Alerts
     ├─ Form (data-review-region=form)   ← class VM; hidden in list mode
     │    ├─ Login                       ← guest
     │    └─ fields + Form:Rating        ← logged-in
     └─ Results (island; list region)    ← hidden in form mode; XHR-swapped
          ├─ Language (control: language)
          ├─ Sort (control: sort)
          ├─ counter
          ├─ Item × N   ← owner item: Edit → Panel.openForm
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
| `openForm` / `closeForm` | Toggle form ↔ list (`data-review-mode` + region `hidden`) |
| `save(FormData)` | POST save → replace Panel root |

Form region = `Review:Form` root (`data-review-region="form"`). List region = `Review:Results` root (`data-component` island). After Results XHR swap, Panel re-applies list `hidden` from current mode.

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

## Edit entry points

| Entry | When |
|-------|------|
| `Review:Teaser` | Logged-in customer with `customerReview` (global aside CTA) |
| `Review:Item` | Same customer’s review **on the current results page** (`review.id == reviews.customerReview.id`) → link-style button → `Panel.openForm` |

Both reuse form prefill + hidden `id` from `customerReview` / `formValues`. Label: `detail.reviewExistsTeaserButton`. Teaser behavior unchanged.

## Related leaves

| Component | Notes |
|-----------|--------|
| `Review:Item` | `editable` from Results; `Item.js` only mounted when editable |
| `Review:Matrix` | Class VM builds `rows` / `visible` from matrix + query `points`; JS control; nests `check` / `bar` / `share` |
| `Review:Matrix:Check` / `Bar` / `Share` | Row cells; Check CVA `control`/`input`/`label` (`form-check*`); Bar `progress`/`fill`; Share root |
| `Review:Rating` | Display stars leaf; class VM builds `starIcons` |
| `Review:Average` | Visible average line; composed by Summary (`totalReviewCount > 0`) |

| `Form:Textarea` | Shared primitive (title/content style parity with `Form:Input`) |
| `Form:Switch` / `Form:Select` / `Form:Input` | Language, sort, form fields |
| `Account:Login` | Nested in `Review:Login` (under `Review:Form`) with PDP redirect |
| `Review:Login` | Presentational; cancel handled by `Form.js` (`data-review-form-action`) |
| `Pagination` | `ownerComponent` prop targets Review:Panel on this page |

## Related

- [Buy container](buy-container.md) — `Product:Rating` summary (not the tab)
- [Product box](product-box.md) — card stars via `Review:Rating`
- [Form input](form-input.md) — field primitives
- [Architecture](../architecture.md) — `/vi/…` + App hooks
