# Product reviews

Theme-owned PDP Description/Reviews **chrome** (`tabs` or `accordion`) and reviews **content**: summary, matrix filter, list island, write/edit form. Core storefront review plugins / `FormAjaxSubmit` / `js-review-container` / Bootstrap `card-tabs` / `OffCanvasTabs` are **not** used.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/review/review.html.twig` → `Review:Panel` (strips offcanvas chrome) |
| `Review:Results:Toolbar` | Language + sort + counter chrome |
| `Review:Sidebar` | Aside column: Summary + Matrix + Teaser |
| `Review:Matrix` | Class VM points filter control (`points[]`); rows from matrix + URL SoT |
| `Review:Alerts` | Post-save / validation flash alerts |
| `Review:Item:Title` | Review heading text (+ optional `lang`); nested by Header |
| `Review:Item:Header` | Title + stars (`Review:Rating`) + author (`viewsTheme.review.author`) + date |
| `Review:Item:Content` | Body text (`nl2br`, optional `lang`) |
| `Review:Item:Comment` | Merchant reply card; root-hosts `Blockquote` (+ default shop-owner footer snippet) |
| `Review:Average` | Text average (`points` / `maxPoints`); composed by Summary when `totalReviewCount > 0` |
| CMS bridge | `storefront/element/cms-element-product-description-reviews.html.twig` → `Cms:DescriptionReviews` |
| Content bridge | `storefront/component/review/review.html.twig` → `Review:Panel` (non-CMS / legacy include path) |
| `Review:Panel` | Class VM + **owner JS**: URL SoT, Results XHR, form mode, save |
| `Review:Results` | XHR-swappable island (toolbar, items, pagination) |
| `Review:Summary` / `Matrix` / `Teaser` | Aside chrome + points control + write CTA |
| `Review:Item` | Single review card (Header / Content / Comment); no per-row edit CTA |
| `Review:Form` / `Form:Rating` / `Login` | Create/edit + star picker + account login. Save form uses `Form:Handler` (`preventNative`) then `Panel.save`; Form resets `setSubmitting(false)` if the handler is still mounted |
| `Review:Rating` | Display-only stars leaf (also buy-box / product card) |
| `Cms:DescriptionReviews` | CMS element shell: `appearance` (`tabs` \| `accordion`), which panes, `ratingSuccess` active item, mounts content |
| `Tabs` / `Tabs:List` / `Tab` / `Panel` | Generic a11y tabs primitive — [tabs.md](tabs.md) |
| `Accordion` / `Item` / `Header` / `Panel` | Generic a11y accordion primitive — [accordion.md](accordion.md) |
| `Product:Description:Detail` | Description pane: title + `Product:Description` + `Product:Properties` |
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
 Cms:DescriptionReviews (CMS shell — no JS; FromMethod chrome)
 ├─ appearance=tabs (default) → Tabs (data-component — a11y owner)
 │    ├─ Tabs:List
 │    │    ├─ Tabs:Tab description
 │    │    └─ Tabs:Tab reviews          ← if core.listing.showReview
 │    └─ panels
 │         ├─ Tabs:Panel description → Product:Description:Detail
 │         └─ Tabs:Panel reviews → Review:Panel
 └─ appearance=accordion → Accordion (data-component — a11y owner)
      ├─ Item description → Header + Panel → Product:Description:Detail
      └─ Item reviews → Header + Panel → Review:Panel   ← if core.listing.showReview
```

### CMS appearance

Theme extends core `product-description-reviews` element config (admin override + `defaultConfig` merge). Presentation only.

```js
viewsTheme: {
  source: 'static',
  value: { appearance: 'tabs' }, // 'tabs' | 'accordion'
}
```

| Path | Type | Default |
|------|------|---------|
| `viewsTheme.value.appearance` | `tabs` \| `accordion` | `tabs` |

Bridge reads `element.config.viewsTheme.value.appearance`. Missing key / existing layouts → `tabs`. PHP normalizes unknown values to `tabs`.

Config is **per content language** (cms slot translation). Save once per language you use on the storefront.

Admin: `app/administration/src/extension/sw-cms/elements/product-description-reviews/` + `main.js` — Options tab, theme-only banner + appearance select.

`Cms:DescriptionReviews` resolves chrome via Symfony UX `FromMethod` (`resolveTemplate`): tabs → `Cms/DescriptionReviews.html.twig`; accordion → `Cms/DescriptionReviews/Accordion.html.twig`.

### Chrome

| Concern | Behaviour |
|---------|-----------|
| Tabs | [Tabs](tabs.md) — same UI all viewports; **no** mobile offcanvas clone |
| Accordion | [Accordion](accordion.md) — exclusive, not collapsible (one pane always open) |
| Active item (SSR) | Reviews when `ratingSuccess` is truthy or ∈ `{1, 2, -1}`; else Description → `Tabs.active` / `Accordion.active` |
| Stable ids | `description-tab-{productId}` / `review-tab-{productId}` (+ `-pane`) |

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
| `Review:Item:Title` | Props `title` / `lang`; heading chrome; nested by Header |
| `Review:Item:Header` | Presentational header; props `title` / `lang` / `points` / `externalUser` / `createdAt`; nests `title` → `Item:Title`, `rating` → `Review:Rating` |
| `Review:Item:Content` | Props `content` / `lang`; body `nl2br` |
| `Review:Item:Comment` | Reply card; prop `comment`; body `nl2br`; root-hosts `Blockquote` via `class="{{ vi_class('root') }}"` + `attributes.defaults` (default `footer` = `viewsTheme.review.commentFooter`; Item nest `comment` extras merge into Comment root) |
| `Review:Matrix` | Class VM builds `rows` / `visible` from matrix + query `points`; JS control; nests `check` / `bar` / `share` |
| `Review:Matrix:Check` / `Bar` / `Share` | Row cells; Check CVA `control`/`input`/`label` (`form-check*`); Bar nests `progress` → `Progress`; Share root |
| `Blockquote` | Generic `<blockquote>`; CVA `root`/`content`/`footer`; props `content` / `footer` (string, default `null`) or blocks; body in nest `content` `<p>`; optional nest `footer` `<footer>` |
| `Progress` | Generic bar; CVA `root`/`fill`; props `value`/`min`/`max`/`size` (`sm`\|`md`\|`lg`, default `md`)/`color` (`none`\|`primary`\|…\|`dark`, default `none`)/`striped`/`animate` (bool, default false) |
| `Review:Average` | Visible average line; composed by Summary (`totalReviewCount > 0`) |
| `Product:Description:Detail` | PDP description pane composition |
| `Product:Properties` | Spec table from `product.sortedProperties` |
| `Product:Description` | HTML description body (also product card) |
| `Review:Item` | Presentational card only (no `editable` prop / no `Item.js`) |
| `Review:Rating` | Display stars; class VM builds `starIcons` |
| `Form:Textarea` | Shared primitive (title/content style parity with `Form:Input`) |
| `Form:Switch` / `Form:Select` / `Form:Input` | Language, sort, form fields |
| `Account:Login` | Nested in `Review:Login` (under `Review:Form`) with PDP redirect; `layout: column` via nest defaults |
| `Review:Login` | Presentational guest gate |
| `Pagination` | `ownerComponent` prop targets Review:Panel on this page |

## Related

- [Buy container](buy-container.md) — `Product:Rating` summary (not the tab)
- [Product box](product-box.md) — card stars via `Review:Rating`
- [Form input](form-input.md) — field primitives
- [Tabs](tabs.md) — default CMS chrome
- [Accordion](accordion.md) — CMS `appearance=accordion` chrome
- [Architecture](../architecture.md) — `/vi/…` + App hooks
