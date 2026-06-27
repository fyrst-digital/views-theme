// ViewsTheme Storefront JS entry point
// Register custom plugins here
import CartPlugin from './plugins/cart.plugin'

const PluginManager = window.PluginManager

PluginManager.register('CartPlugin', CartPlugin, '[data-component="header-action-cart"]')
