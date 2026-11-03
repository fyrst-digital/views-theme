import template from './views-theme-icon.html.twig';

const { Component } = Shopware;

/**
 * The Views mark from `public/img/views-logo.svg`, drawn in `currentColor` so it
 * follows the surrounding text color in the admin light and dark themes.
 */
Component.register('views-theme-icon', {
    template,
});
