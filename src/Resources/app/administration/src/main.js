import './extension/sw-cms/elements/product-listing';
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
