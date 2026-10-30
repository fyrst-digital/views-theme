import template from './sw-cms-sidebar.html.twig';

const { Component } = Shopware;

Component.override('sw-cms-sidebar', {
    template,

    computed: {
        sectionGapViewport() {
            switch (this.currentDeviceView) {
                case 'mobile':
                    return 'mobile';
                case 'tablet-landscape':
                    return 'tablet';
                default:
                    return 'desktop';
            }
        },

        sectionGapPlaceholder() {
            const smaller = {
                mobile: [],
                tablet: ['mobile'],
                desktop: ['tablet', 'mobile'],
            }[this.sectionGapViewport];

            const inherited = smaller
                .map((viewport) => this.getSectionGap(viewport))
                .find((value) => value !== null && value !== '');

            return inherited === undefined ? '' : String(inherited);
        },

        sectionGapLabel() {
            return `${this.$t('viewsTheme.sw-cms.sections.layout.gap')} – ${this.$t(
                `viewsTheme.sw-cms.sections.layout.${this.sectionGapViewport}`,
            )}`;
        },
    },

    methods: {
        getSectionGap(viewport) {
            return this.selectedSection?.customFields?.viewsTheme?.layout?.gap?.[viewport] ?? null;
        },

        onSectionGapChange(viewport, value) {
            const customFields = this.selectedSection.customFields ?? {};
            const viewsTheme = customFields.viewsTheme ?? {};
            const layout = viewsTheme.layout ?? {};
            const gap = layout.gap ?? {};

            this.selectedSection.customFields = {
                ...customFields,
                viewsTheme: {
                    ...viewsTheme,
                    layout: {
                        ...layout,
                        gap: {
                            ...gap,
                            [viewport]: value === '' ? null : value,
                        },
                    },
                },
            };
        },
    },
});
