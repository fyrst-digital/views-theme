# Product reviews

Theme-owned PDP reviews tab: summary, matrix filter, list island, write/edit form. Core storefront review plugins / `FormAjaxSubmit` / `js-review-container` are **not** used.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/review/review.html.twig` → `Review:Panel` (strips offcanvas chrome) |
| `Review:Panel` | Class VM + **owner JS**: URL SoT, Results XHR, save |
| `Review:Results` | XHR-swappable list island (toolbar, items, pagination); list region host |
| `Review:Results:Toolbar` | Language + sort + counter chrome |
| `Review:Sidebar` | Aside column: Summary + Matrix + Teaser |
| `Review:Summary` / `Teaser` | Counts chrome + always-visible Form host; Summary rating host = stars + Average |
| `Review:Matrix` | Class VM points filter control (`points[]`); rows from matrix + URL SoT |
| `Review:Alerts` | Post-save / validation flash alerts |
| `Review:Item` | Single review card shell: Header → Content → Comment |
| `Review:Item:Title` | Review heading text (+ optional `lang`); nested by Header |
| `Review:Item:Header` | Title + stars (`Review:Rating`) + author (`viewsTheme.review.author`) + date |
| `Review:Item:Content` | Body text (`nl2br`, optional `lang`) |
| `Review:Item:Comment` | Merchant reply card; root-hosts `Blockquote` (+ default shop-owner footer snippet) |
| `Review:Form` | Class VM + region host under Teaser (always shown): Login (guest) or create/edit fields; JS owns only `[data-review-form=save]` |
| `Review:Form:Rating` / `Login` | Star picker (hidden `points` + `data-points` icons + one text from `pointLabels` options); icon props `iconFull` / `iconEmpty` (defaults `star-fill` / `star`, also in JS options) + account login (native POST) |
| `Review:Rating` | Display stars leaf; icon props `iconFull` / `iconHalf` / `iconEmpty` (defaults `star-fill` / `star-half-fill` / `star`); also buy-box / product card |
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
│    │         ├─ Bar     ← nest `bar` → Progress
│    │         └─ Share   ← nest `share`
│    └─ Teaser          ← presentational; always hosts Form
│         ├─ title / text
│         └─ Form (data-review-region=form)   ← class VM; always visible
│              ├─ Login                       ← guest
│              └─ fields + Form:Rating        ← logged-in
└─ Main
     ├─ Alerts
     └─ Results (island; list region)    ← always visible; XHR-swapped
          ├─ Toolbar
          │    ├─ Language (control: language)
          │    ├─ Sort (control: sort)
          │    └─ counter
          ├─ Item × N
          │    ├─ Header
          │    │    ├─ Title
          │    │    └─ Rating + author + date
          │    ├─ Content
          │    └─ Comment          ← when review.comment → Blockquote
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
- Success / validation alerts are **local UI state** (not URL), except post-save HTML replace

## Controllers

| Route | Path | Response |
|-------|------|----------|
| `frontend.views-theme.review.list` | `GET /vi/product/{productId}/reviews` | HTML `Review:Results` |
| `frontend.views-theme.review.save` | `POST /vi/product/{productId}/reviews` | HTML full `Review:Panel` |

After load: fire `ProductReviewsWidgetLoadedHook` (App parity).  
Save: call `AbstractProductReviewSaveRoute` only; on violations re-render form with `formViolations` + plain `formValues` array (never `RequestDataBag`); on success reload + alert.

Render via `AbstractComponentController::renderComponent()`.

Query also carries `parentId` when needed (variant products).

## Owner JS (`Review/Panel.js`)

| API | Role |
|-----|------|
| `apply(patch, { pushHistory, resetPage })` | Results XHR + history |
| `syncControls` / `refreshControls` / `hydrateFromUrl` | Control registry |
| `save(FormData)` | POST save → replace Panel root |

Form region = `Review:Form` root under Teaser (`data-review-region="form"`), always visible. List region = `Review:Results` always visible.

Modules under `@views-theme/modules/review/` (+ shared helpers):

| Module | Role |
|--------|------|
| `params.js` | merge / URL parse (`points[]`); re-exports `objectOption` / `collectControlValues` from `shared/object-option` |
| `history.js` | thin wrapper → `shared/history` with review encode (`points[]`) |
| `fetch.js` | list GET + save POST (abort/seq) |
| `apply.js` | façade for controls → `Panel.apply` |

Domain stays isolated from `listing/*` — [javascript.md](../conventions/javascript.md).

Events: `ViewsTheme:Review:Loading`, `ViewsTheme:Review:Changed`.

Controls call Panel only via `@views-theme/modules/review/apply.js` — not raw listing internals.

## Write / edit

`Review:Teaser` always shows Form: guest login or write/edit prefilled from `customerReview` / `formValues` (hidden `id` when editing).

## Related leaves

| Component | Notes |
|-----------|--------|
| `Review:Results:Toolbar` | Language + Sort + counter; nests `language` / `sort` / `counter` |
| `Review:Item` | Composition shell (no JS); nests `header` / `content` / `comment`; no numeric score or category row |
| `Review:Item:Title` | Props `title` / `lang`; heading chrome; nested by Header |
| `Review:Item:Header` | Presentational header; props `title` / `lang` / `points` / `externalUser` / `createdAt`; nests `title` → `Item:Title`, `rating` → `Review:Rating` |
| `Review:Item:Content` | Props `content` / `lang`; body `nl2br` |
| `Review:Item:Comment` | Reply card; prop `comment`; body `nl2br`; root-hosts `Blockquote` via `class="{{ vi_class('root') }}"` + `attributes.defaults` (default `footer` = `viewsTheme.review.commentFooter`; Item nest `comment` extras merge into Comment root) |
| `Review:Matrix` | Class VM builds `rows` / `visible` from matrix + query `points`; JS control; nests `check` / `bar` / `share` |
| `Review:Matrix:Check` / `Bar` / `Share` | Row cells; Check CVA `control`/`input`/`label` (`form-check*`); Bar nests `progress` → `Progress`; Share root |
| `Blockquote` | Generic `<blockquote>`; CVA `root`/`content`/`footer`; props `content` / `footer` (string, default `null`) or blocks; body in nest `content` `<p>`; optional nest `footer` `<footer>` |
| `Progress` | Generic bar; CVA `root`/`fill`; props `value`/`min`/`max`/`size` (`sm`\|`md`\|`lg`, default `md`)/`color` (`none`\|`primary`\|…\|`dark`, default `none`)/`striped`/`animate` (bool, default false) |
| `Review:Rating` | Display stars leaf; class VM builds `starIcons` from `iconFull` / `iconHalf` / `iconEmpty` |
| `Review:Average` | Visible average line; composed by Summary (`totalReviewCount > 0`) |

| `Form:Textarea` | Shared primitive (title/content style parity with `Form:Input`) |
| `Form:Switch` / `Form:Select` / `Form:Input` | Language, sort, form fields |
| `Account:Login` | Nested in `Review:Login` (under `Review:Form`) with PDP redirect |
| `Review:Login` | Presentational guest gate |
| `Pagination` | `ownerComponent` prop targets Review:Panel on this page |

## Related

- [Buy container](buy-container.md) — `Product:Rating` summary (not the tab)
- [Product box](product-box.md) — card stars via `Review:Rating`
- [Form input](form-input.md) — field primitives
- [Architecture](../architecture.md) — `/vi/…` + App hooks
