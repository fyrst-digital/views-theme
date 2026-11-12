# 2.0.0

**Upgrade notes**
- **Breaking change:** ViewsTheme moved from Fyrst to Webflare. The Composer package is now `webflare/views-theme` and the PHP namespace is `Webflare\ViewsTheme`. Shops that run 1.x must switch the Composer package and update the plugin row in the database once, after the new code is deployed and before `plugin:refresh`. Without that step the theme is not loaded and `plugin:refresh` fails. Follow the upgrade guide: https://github.com/webflare-sh/views-theme/blob/master/UPGRADE-2.0.md
- PHP code and service configuration in child themes or plugins that refer to `Fyrst\ViewsTheme` classes or service IDs must use `Webflare\ViewsTheme` instead. Twig, SCSS, JS and snippet overrides need no changes. The theme assignment, theme settings and plugin configuration are kept.
- The default theme credit in the footer now links to webflare.sh. Shops that pass their own `brand` keep theirs.

**Changelog**
- ViewsTheme is now published by Webflare: Composer package `webflare/views-theme`, repository https://github.com/webflare-sh/views-theme
- The footer theme credit reads "Webflare" and links to https://webflare.sh

# 1.1.5

**Upgrade notes**
- Child themes can now change ViewsTheme's Bootstrap Sass variables (button and input radius, padding, font sizes, colors, spacers, breakpoints, ...) from a file listed before `@ViewsTheme` in their `style` list. Values that a child theme already set there, and that had no effect before, now apply. A child theme's `$utilities` map is merged with ViewsTheme's utilities instead of being ignored.

**Changelog**
- Child themes can override the button and input radius and the other Bootstrap settings of ViewsTheme without patching the compiled CSS

# 1.1.4

**Upgrade notes**
- The Shopping Experiences product slider and the product page cross-selling now render the theme carousel instead of the Shopware slider. The slider settings for autoplay, speed, border, vertical alignment, display mode and arrow position are no longer used. Template overrides of the inner `element_product_slider_*` blocks no longer apply; extend `Product:Carousel` or the new `element_product_slider_carousel` block instead.
- Cross-selling on the product page now uses the theme tabs (`Cms:CrossSelling`). Template overrides of the inner `cms_element_cross_selling_*` blocks no longer apply; extend `Cms:CrossSelling` instead.
- The image gallery now uses the theme carousel for its slides. The `ViewsTheme:Gallery:Canvas` JS component (`Canvas.js`, `goTo`) was removed: call `select(index)` on the `Gallery` instead. `Gallery:Canvas` nests changed from `track:*` to `carousel:*`, `item:*` and `slide:*`. `Gallery:Slide` no longer has the `total` prop or a slide role and label; the wrapping carousel item has them, and its label now reads "1 of 6" instead of "Show image 1 of 6".

**Changelog**
- New product carousel for the product slider and cross-selling: swipe or scroll through products, with previous/next buttons that hide when all products fit
- The product image gallery shares the carousel's swipe track. It looks and works as before: thumbnails and dots follow your swipes, and the current image stays in place when the window is resized or the phone is rotated
- Cross-selling tabs and their products are shown on every screen size; on phones they no longer move into a side panel
- The browser console no longer logs the "Init method has to be implemented." warning on category listings and other pages with filters or the newsletter form

# 1.1.3

**Upgrade notes**
- The `Navigation:Flyout` JS component (`Flyout.js`) and its open/close events were removed. `Navigation:Bar` now owns the flyouts. Overrides that hooked into the Flyout component must hook into `Navigation:Bar` instead.
- The navigation flyout route now only accepts a 32-character hex category id.

**Changelog**
- The navigation flyout now closes when you hover a menu item without a flyout or empty space in the bar
- Product filters appear on category listings again. CMS elements receive the page context again, so they no longer render blank and hide their block

# 1.1.2

**Upgrade notes**
- **Behaviour change:** the storefront logo no longer uses the inherited Storefront `sw-logo-desktop` / `sw-logo-tablet` / `sw-logo-mobile` fields. Set `page-logo` in the theme Media settings. If `page-logo` is empty, the bundled Views logo is shown. Favicon and Open Graph images are unchanged and still use the Storefront `sw-logo-*` fields.
- **Removed:** the `/vi/search/overlay` route (`frontend.views-theme.search.overlay`) and the `overlayUrl` prop of `Search:Action`. The search overlay now ships with the page. Overrides that changed the overlay through that route must extend `Search:Overlay` instead.

**Changelog**
- Empty `page-logo` now renders the bundled Views logo instead of the Shopware demo logo from `sw-logo-*`
- The Figtree font is preloaded, so it starts loading right away instead of after the theme stylesheet
- The product image gallery no longer misplaces the image when a product has only one
- The navigation drawer, navigation flyout, fullscreen gallery, category listing and category filter drawer responses are now HTTP-cached, so they open faster on repeat requests
- The cart drawer opens as soon as you click it and shows a loading spinner until the cart is loaded
- The search overlay opens instantly, with no request to the server

# 1.1.1

**Changelog**
- Lazily loaded overlays, drawers, the address manager, and the navigation flyout open on the first click, including on a cold production asset load

# 1.1.0

**Upgrade notes**
- Theme settings were renamed and regrouped. Colors, fonts and logos set in version 1.0.0 are not carried over: check the theme settings after updating and enter them again
- The theme no longer has separate tablet and mobile logos, a share icon, a favicon or a tertiary color setting
- Rebuild and recompile the storefront and administration assets after updating

**Changelog**
- Theme settings are grouped into Colors, Typography and Media tabs, with new options for status colors, header, body and footer backgrounds, border color, corner radius, spacing, icon sizes, heading sizes and breakpoints
- Logo width can be set separately for mobile, tablet and desktop
- Redesigned header: language and currency switches sit with the header actions on large screens
- Redesigned footer with newsletter sign-up, shop address and contact buttons for phone, email and the contact form (new shop information settings)
- Redesigned cookie bar and cookie settings, which now open in a drawer
- Redesigned back-to-top button
- Redesigned cart page with an optional shipping cost calculation in the cart sidebar and cart drawer (plugin setting)
- Checkout register, confirm and success pages share one layout, with selection cards for payment and shipping methods that show shipping prices
- Optional delivery date range in the checkout summary (plugin setting)
- Addresses are changed in a redesigned address manager during checkout
- The minimal checkout header links back to the cart
- Login and registration share one page with tabs
- Customers can filter their order history by status and date and repeat a past order
- Redesigned customer account pages
- Redesigned variant selection on the product page, with a notice and restock hint when a product cannot be bought
- Restyled active filter chips and filter reset
- Shopping Experiences: section spacing can be set per viewport in the layout editor
- Dedicated Views Theme settings page in the administration, with a plugin icon and a theme preview image
- Redesigned form fields, checkboxes and radio buttons

# 1.0.0

**Changelog**
- First stable release of the ViewsTheme storefront for Shopware 6.7.11 and newer
- Redesigned product listing, product detail, cart, checkout, account, and footer
- Product listing includes filters, sorting, and pagination
- Product detail page includes an image gallery, buy box, and reviews
- Optional variants grid on the product page for adding several variants to the cart (plugin setting)
- Optional preferred delivery date on checkout, stored on the order (plugin setting)
- Cart can be opened in a drawer and edited on its own page
- Search opens in an overlay; desktop navigation uses a flyout and mobile navigation uses a drawer
- Shoppers can switch language and currency
- Addresses can be managed in checkout and in the customer account
- Wishlist is supported
