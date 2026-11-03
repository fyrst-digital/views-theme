import template from './views-theme-settings.html.twig';

const { Component, Mixin } = Shopware;

Component.register('views-theme-settings', {
    template,

    mixins: [Mixin.getByName('notification')],

    data() {
        return {
            isLoading: false,
            isSaveSuccessful: false,
        };
    },

    metaInfo() {
        return {
            title: this.$createTitle(),
        };
    },

    methods: {
        saveFinish() {
            this.isSaveSuccessful = false;
        },

        onSave() {
            this.isSaveSuccessful = false;
            this.isLoading = true;

            this.$refs.systemConfig
                .saveAll()
                .then(() => {
                    this.isSaveSuccessful = true;
                })
                .catch((error) => {
                    this.createNotificationError({ message: error });
                })
                .finally(() => {
                    this.isLoading = false;
                });
        },

        onLoadingChanged(loading) {
            this.isLoading = loading;
        },
    },
});
