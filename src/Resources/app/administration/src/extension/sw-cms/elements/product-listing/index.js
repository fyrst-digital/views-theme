import template from './sw-cms-el-config-product-listing.html.twig';

const { Component } = Shopware;

Component.override('sw-cms-el-config-product-listing', {
    template,

    computed: {
        filterLayoutOptions() {
            return [
                {
                    value: 'bar',
                    label: this.$t('viewsTheme.sw-cms.elements.productListing.config.filter.layoutBar'),
                },
                {
                    value: 'stacked',
                    label: this.$t('viewsTheme.sw-cms.elements.productListing.config.filter.layoutStacked'),
                },
            ];
        },
    },
});
