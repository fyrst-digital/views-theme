# Unreleased

**Changelog**
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
