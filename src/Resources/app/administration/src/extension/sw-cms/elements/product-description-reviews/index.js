import template from './sw-cms-el-config-product-description-reviews.html.twig';

const { Component } = Shopware;

Component.override('sw-cms-el-config-product-description-reviews', {
    template,

    computed: {
        appearanceOptions() {
            return [
                {
                    value: 'tabs',
                    label: this.$t('viewsTheme.sw-cms.elements.productDescriptionReviews.config.appearance.tabs'),
                },
                {
                    value: 'accordion',
                    label: this.$t('viewsTheme.sw-cms.elements.productDescriptionReviews.config.appearance.accordion'),
                },
            ];
        },
    },
});
