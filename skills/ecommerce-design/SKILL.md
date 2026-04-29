---
name: ecommerce-design
description: >
  Specialized for designing high-fidelity ecommerce desktop and mobile web UIs inside Pencil.
  Use when creating or editing product listings, PDPs, cart, checkout, navigation, filters,
  account pages, or any ecommerce storefront components. Triggers: shopware, ecommerce,
  product card, cart, checkout, listing, PDP, PLP, storefront, webshop, online store.
---

# Ecommerce Design Skill

Design modern minimal ecommerce web UIs in Pencil with a focus on clarity, conversion, and responsive patterns.

## When This Skill MUST Be Used

**ALWAYS invoke this skill for requests involving ANY of these:**

- Designing ecommerce screens: Homepage, PLP, PDP, Cart, Checkout, Account, Search
- Creating or editing reusable ecommerce components: product cards, buttons, inputs, badges, swatches, tabs
- Building responsive desktop (1280px+) and mobile (375px) variants of storefront screens
- Adding navigation, filters, sorting, pagination, breadcrumbs
- Designing promotional banners, hero sections, or featured product grids
- Any task mentioning Shopware, ecommerce, webshop, online store, or storefront UI

## Design Philosophy: Modern Minimal

- **Clean surfaces**: White or very light gray backgrounds (`#FFFFFF`, `#F8F9FA`, `#F3F4F6`)
- **Strong hierarchy**: Clear distinction between headings, body text, captions, and labels
- **Whitespace**: Generous padding and gaps; avoid cramped layouts
- **Subtle depth**: Use 1px borders (`#E5E7EB`) or very soft shadows for elevation, never heavy drop shadows
- **Rounded corners**: 8px for inputs/buttons, 12–16px for cards and modals
- **Product-first**: Imagery dominates; text supports decision-making

## Design Tokens

Define these variables in the `.pen` file before building any components or screens:

### Typography (Font: Figtree)
| Variable | Value | Usage |
|----------|-------|-------|
| `font-family` | `"Figtree"` | All text |
| `font-size-xs` | `12` | Captions, badges, helper text |
| `font-size-sm` | `14` | Body small, buttons, labels |
| `font-size-md` | `16` | Body default, input text |
| `font-size-lg` | `20` | Subheadings, card titles |
| `font-size-xl` | `24` | Section headings |
| `font-size-2xl`| `32` | Hero/PDP titles |
| `font-weight-regular` | `"400"` | Body text |
| `font-weight-medium` | `"500"` | Buttons, labels |
| `font-weight-bold` | `"700"` | Headings, prices |
| `line-height-tight` | `1.25` | Headings |
| `line-height-normal`| `1.5` | Body text |

### Colors
| Variable | Value | Usage |
|----------|-------|-------|
| `color-accent` | `#19BF56` | Primary CTAs, active states, links, success indicators |
| `color-accent-dark`| `#A3EFAC` | Accent for dark mode contexts (variable-ready) |
| `color-surface` | `#FFFFFF` | Main backgrounds |
| `color-surface-elevated` | `#F8F9FA` | Cards, modals, elevated surfaces |
| `color-surface-subtle` | `#F3F4F6` | Alternate sections, hover states |
| `color-text-primary` | `#111827` | Main headings, body text |
| `color-text-secondary`| `#6B7280` | Descriptions, placeholders, meta info |
| `color-text-tertiary`| `#9CA3AF` | Disabled, timestamps, captions |
| `color-border` | `#E5E7EB` | Dividers, input borders, card outlines |
| `color-border-focus` | `#19BF56` | Focused input borders |
| `color-error` | `#EF4444` | Errors, out-of-stock, remove actions |
| `color-error-bg` | `#FEF2F2` | Error message backgrounds |
| `color-warning` | `#F59E0B` | Warnings, low stock |
| `color-success` | `#19BF56` | Success, in-stock, confirmations |
| `color-sale` | `#DC2626` | Sale prices, discount badges |
| `color-sale-bg` | `#FEF2F2` | Sale badge backgrounds |

### Spacing (8px base grid)
| Variable | Value | Usage |
|----------|-------|-------|
| `space-xs` | `4` | Tight gaps, icon padding |
| `space-sm` | `8` | Inline gaps, small padding |
| `space-md` | `16` | Standard gaps, card padding |
| `space-lg` | `24` | Section gaps, modal padding |
| `space-xl` | `32` | Major section separators |
| `space-2xl`| `48` | Hero/section padding |
| `space-3xl`| `64` | Page-level padding |

### Sizing
| Variable | Value | Usage |
|----------|-------|-------|
| `radius-sm` | `4` | Small tags, chips |
| `radius-md` | `8` | Buttons, inputs |
| `radius-lg` | `12` | Cards, dropdowns |
| `radius-xl` | `16` | Modals, large cards |
| `radius-full`| `9999` | Pills, avatars, circular swatches |

### Shadows
| Variable | Value | Usage |
|----------|-------|-------|
| `shadow-sm` | `{type:"shadow", shadowType:"outer", offset:{x:0,y:1}, blur:2, color:"#0000000D"}` | Subtle elevation |
| `shadow-md` | `{type:"shadow", shadowType:"outer", offset:{x:0,y:4}, blur:6, color:"#0000001A"}` | Cards, dropdowns |
| `shadow-lg` | `{type:"shadow", shadowType:"outer", offset:{x:0,y:10}, blur:15, color:"#00000026"}` | Modals, popovers |

## Reusable Components (Build These First)

Place all reusable components in a dedicated **Design System** frame on the canvas, separate from screen frames.

### Button / Primary
- Frame, horizontal layout, `padding: [12, 24]`, `radius-md`, fill `color-accent`
- Text: `font-size-sm`, `font-weight-medium`, fill `#FFFFFF`
- Hover state (if creating variants): slightly darker accent or subtle shadow

### Button / Secondary
- Frame, horizontal layout, `padding: [12, 24]`, `radius-md`, fill `color-surface`, stroke `color-border`
- Text: `font-size-sm`, `font-weight-medium`, fill `color-text-primary`

### Button / Ghost
- Frame, horizontal layout, `padding: [8, 16]`, `radius-md`, no fill
- Text: `font-size-sm`, `font-weight-medium`, fill `color-accent`

### Input / Text Field
- Frame, horizontal layout, `padding: [12, 16]`, `radius-md`, fill `color-surface`, stroke `color-border`
- Text: `font-size-md`, fill `color-text-primary`
- Placeholder text: `color-text-tertiary`

### Input / Search Bar
- Frame, horizontal layout, `padding: [12, 16]`, `radius-md`, fill `color-surface-elevated`, stroke `color-border`
- Icon (search) left, text center, optional clear button right

### Product Card
- Frame, vertical layout, `radius-lg`, fill `color-surface`, stroke `color-border`
- **Image area**: Frame, `width: "fill_container"`, aspect ratio 3:4 or 1:1, `radius-lg` top corners
- **Content area**: Frame, vertical layout, `padding: 16`, `gap: 8`
  - Brand name: `font-size-xs`, `font-weight-medium`, fill `color-text-secondary`
  - Product name: `font-size-sm`, `font-weight-medium`, fill `color-text-primary`, 2 lines max
  - Price row: Frame, horizontal layout, `gap: 8`
    - Current price: `font-size-md`, `font-weight-bold`, fill `color-text-primary`
    - Original price (if on sale): `font-size-sm`, fill `color-text-tertiary`, strikethrough
    - Sale price: `font-size-md`, `font-weight-bold`, fill `color-sale`
  - Rating row: Frame, horizontal layout, `gap: 4`
    - Star icon(s) + review count text
- **Action area**: Frame, horizontal layout, `padding: [0, 16, 16, 16]`, `gap: 8`
  - "Add to Cart" button (primary, fill container)
  - Wishlist icon button

### Variant / Color Swatch
- Ellipse or frame, `width: 32`, `height: 32`, `radius-full`
- Stroke: 2px `color-border` (default), 2px `color-text-primary` (selected)
- Fill: actual product color
- Selected state: add outer ring using stroke

### Variant / Size Pill
- Frame, horizontal layout, `padding: [8, 16]`, `radius-md`
- Default: fill `color-surface`, stroke `color-border`, text `color-text-primary`
- Selected: fill `color-text-primary`, text `#FFFFFF`
- Disabled: fill `color-surface-subtle`, text `color-text-tertiary`, no stroke

### Badge
- Frame, horizontal layout, `padding: [4, 8]`, `radius-sm` or `radius-full`
- Sale badge: fill `color-sale-bg`, text `color-sale`, `font-size-xs`, `font-weight-bold`
- New badge: fill `color-surface-subtle`, text `color-text-primary`
- Out of stock: fill `color-error-bg`, text `color-error`

### Star Rating
- Frame, horizontal layout, `gap: 2`
- 5 star icons; filled stars use `color-warning`, empty stars use `color-border`
- Optional review count text next to stars

### Tabs
- Frame, vertical layout (container)
  - Tab bar: Frame, horizontal layout, `gap: 0`, bottom stroke `color-border`
    - Each tab: Frame, horizontal layout, `padding: [12, 16]`, bottom stroke 2px
      - Active tab: stroke `color-accent`, text `color-text-primary`, `font-weight-medium`
      - Inactive tab: no stroke, text `color-text-secondary`
  - Tab content: Frame, `padding: 16`, fill `color-surface`

### Quantity Stepper
- Frame, horizontal layout, `radius-md`, stroke `color-border`
- Minus button (left), number display (center, `font-size-md`, `font-weight-bold`), plus button (right)
- Each segment: `padding: [8, 12]`

### Filter Chip
- Frame, horizontal layout, `padding: [8, 12]`, `radius-full`
- Default: fill `color-surface`, stroke `color-border`, text `color-text-primary`
- Active: fill `color-accent`, text `#FFFFFF`

### Breadcrumb
- Frame, horizontal layout, `gap: 4`
- Text links separated by `/` or `>` chevron icon
- Last item: `color-text-secondary`, no link styling

### Cart Item Row
- Frame, horizontal layout, `padding: 16`, `gap: 16`, fill `color-surface`
- Thumbnail: Frame, `width: 80`, `height: 80`, `radius-md`
- Details: Frame, vertical layout, `gap: 4`, fill container
  - Name: `font-size-sm`, `font-weight-medium`
  - Variant: `font-size-xs`, `color-text-secondary`
  - Price: `font-size-sm`, `font-weight-bold`
- Actions: Frame, vertical layout, align right
  - Remove button (text or icon)
  - Quantity stepper

### Trust Badge Row
- Frame, horizontal layout, `gap: 24`, `justifyContent: "center"`
- Each badge: Frame, horizontal layout, `gap: 8`
  - Icon + label text (`font-size-xs`, `color-text-secondary`)
- Examples: Free shipping, Secure payment, 30-day returns

### Empty State
- Frame, vertical layout, `padding: 48`, `gap: 16`, align center
- Icon: Large icon (`48px`), `color-text-tertiary`
- Title: `font-size-lg`, `font-weight-bold`, `color-text-primary`
- Description: `font-size-sm`, `color-text-secondary`, centered
- CTA button (optional)

### Modal / Bottom Sheet
- Overlay: Frame, full screen, fill `rgba(0,0,0,0.5)`
- Content: Frame, vertical layout, `padding: 24`, `radius-xl` (top corners only for bottom sheet)
- Close button: Top-right corner, icon button

## Ecommerce Screen Patterns

Always create screens in pairs: **Desktop** (1280px width) and **Mobile** (375px width).

### Homepage
1. **Header**: Logo left, search bar center (desktop) or top row (mobile), account + cart icons right
2. **Navigation**: Horizontal menu (desktop) or hamburger + bottom nav (mobile)
3. **Hero Banner**: Full-width frame, `height: 400–500` (desktop), `height: 300` (mobile)
   - Background image or solid color with text overlay
   - Headline, subheadline, CTA button
4. **Category Grid**: 4–6 category cards in a horizontal scroll (mobile) or grid (desktop)
5. **Featured Products**: Section title + 4-column grid (desktop), 2-column grid (mobile)
6. **Promo Banner**: Full-width, contrasting background, limited-time offer messaging
7. **Newsletter**: Email input + submit button, trust copy
8. **Footer**: Multi-column link groups, payment icons, social links, legal text

### PLP (Product Listing Page)
1. **Header**: Same as homepage
2. **Breadcrumb**: Below header
3. **Title Bar**: Page title + result count, sort dropdown right
4. **Layout**:
   - **Desktop**: Sidebar filters (`width: 240`) + product grid (4-column default, flexible)
   - **Mobile**: Filter/sort toggle bar + 2-column product grid
5. **Filters**: Price range, categories, attributes, ratings
   - Desktop: Sidebar accordion panels
   - Mobile: Bottom sheet or full-screen overlay
6. **Pagination**: Page numbers + prev/next (desktop), infinite scroll or "Load more" (mobile)

### PDP (Product Detail Page)
1. **Breadcrumb**: Top
2. **Main Layout**:
   - **Desktop**: 2-column — Image gallery left (60%), product info right (40%)
   - **Mobile**: Stacked — Gallery top, info below
3. **Image Gallery**: Main image + thumbnail row or swipeable carousel
4. **Product Info Block**:
   - Brand, title, price, rating
   - Short description
   - Variant selectors (color swatches, size pills)
   - Quantity stepper + "Add to Cart" button (primary, full width)
   - Wishlist, share buttons
   - Trust badges (shipping, returns)
5. **Tabs Section**: Description, Specifications, Reviews, Shipping
6. **Related Products**: Horizontal scroll or grid, section title
7. **Sticky Add to Cart Bar** (mobile only): Fixed bottom bar with price + ATC button

### Cart
1. **Layout**:
   - **Desktop**: 2-column — Item list (65%) + Order summary sidebar (35%)
   - **Mobile**: Stacked — Item list top, summary bottom, full-width
2. **Item List**: Cart item rows with quantity steppers
3. **Summary Card**:
   - Subtotal, shipping, tax, total
   - Promo code input
   - "Proceed to Checkout" button (primary, full width)
4. **Empty State**: When no items present

### Checkout (Mini / One-Page)
1. **Steps Indicator**: 3–4 steps (Cart → Information → Shipping → Payment), visual progress
2. **Form Sections**: Email, shipping address, shipping method, payment method
3. **Order Summary**: Collapsible on mobile, sidebar on desktop
4. **Trust Elements**: Security badges, SSL icons, return policy

### Account Dashboard
1. **Navigation**: Sidebar (desktop) or list menu (mobile)
2. **Overview Cards**: Recent orders, saved addresses, wishlist count
3. **Orders List**: Order number, date, status, total, "View details" link
4. **Wishlist**: Product grid similar to PLP

### Search / No Results
1. **Search Bar**: Prominent, full-width or centered
2. **Results Grid**: Same as PLP grid
3. **No Results State**: Empty state with suggestions, trending searches

## Responsive Rules

### Desktop (≥1280px)
- Product grid: 4 columns by default (flexible based on content)
- Filters: Sidebar panel
- Navigation: Horizontal menu
- Multi-column layouts preferred
- Hover states on interactive elements
- Mega menus for category navigation

### Mobile (375px)
- Product grid: 2 columns
- Filters: Bottom sheet or full-screen modal
- Navigation: Hamburger menu + bottom tab bar
- Sticky headers/bars for critical actions
- Full-width CTAs (Add to Cart, Checkout)
- Swipeable carousels for images and categories
- Bottom sheet for variant selection

## Pencil Workflow

1. **Initialize Design Tokens**
   - Call `pencil_set_variables` to define all color, typography, spacing, and sizing tokens.
   - This ensures consistency across all screens and components.

2. **Build Design System Frame**
   - Create a top-level frame named "Design System".
   - Build all reusable components listed above inside this frame with `reusable: true`.
   - Place this frame off to the side of the main canvas.

3. **Create Screen Pairs**
   - For each screen, create two top-level frames: `[Screen Name] - Desktop` and `[Screen Name] - Mobile`.
   - Set widths: Desktop `1280`, Mobile `375`.
   - Use `fit_content` for height.

4. **Assemble with Refs**
   - Use `ref` nodes to instantiate components from the Design System.
   - Override properties via `descendants` or direct property overrides as needed.
   - Never duplicate component structure manually.

5. **Layout Best Practices**
   - Use flexbox (`layout: "horizontal"` or `"vertical"`) for all containers.
   - Prefer `fill_container` and `fit_content` over hardcoded pixel values.
   - Use `gap` and `padding` for spacing; never rely on absolute positioning for flow layouts.
   - Set `placeholder: true` on any frame actively being worked on.
   - Remove `placeholder: false` when a frame is complete.

6. **Image Handling**
   - Insert a frame or rectangle first.
   - Use `G(nodeId, "ai", "prompt")` for AI-generated product or lifestyle images.
   - Use `G(nodeId, "stock", "keywords")` for realistic stock photography.
   - Ensure images have rounded corners matching the design tokens (`radius-lg`, etc.).

7. **Verification**
   - After building or modifying any screen or component, call `pencil_get_screenshot`.
   - Check for alignment, spacing, readability, and visual hierarchy.
   - Verify that text has `fill` colors applied and is visible.

## Shopware Context (Brief)

These UI patterns align with Shopware 6 storefront conventions:
- **CMS Blocks**: Use product sliders, image-text blocks, and listing layouts.
- **Shopping Experiences**: Design for CMS page layouts that merchandisers can configure.
- **Off-Canvas Cart**: Mobile cart often slides in from the right; design accordingly.
- **Listing Layouts**: Grid vs. list view toggles are common in Shopware themes.

## Typography Hierarchy Example

When placing text on screens, follow this hierarchy:

| Level | Size | Weight | Color | Usage |
|-------|------|--------|-------|-------|
| H1 | `font-size-2xl` | Bold | `color-text-primary` | Hero titles, PDP product name |
| H2 | `font-size-xl` | Bold | `color-text-primary` | Section titles |
| H3 | `font-size-lg` | Medium | `color-text-primary` | Card titles, subsections |
| Body | `font-size-md` | Regular | `color-text-primary` | Main body text |
| Body Small | `font-size-sm` | Regular | `color-text-secondary` | Descriptions, meta |
| Caption | `font-size-xs` | Medium | `color-text-secondary` | Labels, badges, timestamps |

## Common Mistakes to Avoid

- **Invisible text**: Always set `fill` on text nodes.
- **Missing textGrowth**: Always set `textGrowth` when you need to control text width/height.
- **Hardcoded dimensions**: Use `fill_container` and `fit_content` instead of guessing pixel sizes.
- **No padding on buttons**: Buttons need internal padding to look clickable.
- **Absolute positioning for flow**: Use flexbox; only use absolute positioning for overlays or decorative elements.
- **Missing placeholder management**: Set `placeholder: true` when editing, remove it when done.
- **Forgotten mobile variant**: Always create mobile frames alongside desktop frames.
- **Low contrast**: Ensure text colors have sufficient contrast against backgrounds.

## Example: Creating a Product Card Instance

```javascript
// Assuming a reusable ProductCard component exists with id "prodCard"
card=I(productGrid,{type:"ref",ref:"prodCard",width:"fill_container"})
U(card+"/imageArea",{fill:"#F3F4F6"})
G(card+"/imageArea","stock","minimal product photo")
U(card+"/contentArea/brandName",{content:"Nike"})
U(card+"/contentArea/productName",{content:"Air Max 270 Sneakers"})
U(card+"/contentArea/priceRow/currentPrice",{content:"$149.99"})
U(card+"/contentArea/priceRow/originalPrice",{content:"$189.99"})
U(card+"/contentArea/priceRow/salePrice",{content:"$149.99"})
U(card+"/actionArea/addToCartBtn",{content:"Add to Cart"})
```

## Decision Framework

When the user requests an ecommerce design task:

1. **Is it a new screen?** → Create Desktop + Mobile frame pair; use refs from Design System.
2. **Is it a new component?** → Build it in the Design System frame first with `reusable: true`.
3. **Is it a layout change?** → Adjust flexbox properties (`gap`, `padding`, `justifyContent`, `alignItems`).
4. **Is it a style change?** → Update the design token variables; changes propagate to all instances.
5. **Is it an image?** → Use `G()` on a frame/rectangle node with appropriate prompts.
6. **Unsure about component structure?** → Use `pencil_batch_get` to inspect existing reusable components before using them.
