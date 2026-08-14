import './extension/sw-cms/elements/product-listing';
import './extension/sw-cms/elements/product-description-reviews';
import enGB from './snippet/en-GB.json';
import deDE from './snippet/de-DE.json';

const { Locale, Service } = Shopware;

Locale.extend('en-GB', enGB);
Locale.extend('de-DE', deDE);

const productListing = Service('cmsService').getCmsElementConfigByName('product-listing');
if (productListing?.defaultConfig) {
    productListing.defaultConfig.viewsTheme = {
        source: 'static',
        value: {
            filterLayout: 'bar',
            showActiveFilters: true,
        },
    };
}

const descriptionReviews = Service('cmsService').getCmsElementConfigByName('product-description-reviews');
if (descriptionReviews?.defaultConfig) {
    descriptionReviews.defaultConfig.viewsTheme = {
        source: 'static',
        value: {
            appearance: 'tabs',
        },
    };
}
