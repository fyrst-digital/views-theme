// ViewsTheme Storefront JS entry point
// Register custom plugins here
import CartPlugin from './plugins/cart.plugin'
import VariantsGridPlugin from './plugins/variants-grid.plugin'

const PluginManager = window.PluginManager

console.log('meddl++++')

PluginManager.register('CartPlugin', CartPlugin, '[data-component="header-action-cart"]')
PluginManager.register('VariantsGrid', VariantsGridPlugin, '[data-component="variants-grid"]')
