import './page/views-theme-settings';

const { Module } = Shopware;

Module.register('views-theme-settings', {
    type: 'plugin',
    name: 'views-theme-settings',
    title: 'viewsTheme.settings.title',
    description: 'viewsTheme.settings.description',
    version: '1.0.0',
    targetVersion: '1.0.0',
    color: 'var(--sw-color-module-neutral-default)',
    icon: 'regular-cog',
    favicon: 'icon-module-settings.svg',

    routes: {
        index: {
            component: 'views-theme-settings',
            path: 'index',
            meta: {
                parentPath: 'sw.settings.index.plugins',
                privilege: 'system.system_config',
            },
        },
    },

    settingsItem: {
        group: 'plugins',
        to: 'views.theme.settings.index',
        icon: 'regular-cog',
        label: 'viewsTheme.settings.title',
        privilege: 'system.system_config',
    },
});
