// ViewsTheme Storefront JS entry point
// Register custom plugins here

import ExamplePlugin from './example-plugin/example-plugin.plugin';

const PluginManager = window.PluginManager;
PluginManager.register('ExamplePlugin', ExamplePlugin, '[data-example-plugin]');
