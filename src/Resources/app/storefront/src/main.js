// ViewsTheme Storefront JS entry point
// Legacy PluginManager plugins (domains not yet on co-located ShopwareComponent)
import VariantsGridPlugin from './plugins/variants-grid.plugin'
import DeliveryDatePlugin from './plugins/delivery-date.plugin'

const PluginManager = window.PluginManager

PluginManager.register('VariantsGrid', VariantsGridPlugin, '[data-component="variants-grid"]')
PluginManager.register('DeliveryDateSelection', DeliveryDatePlugin, '[data-component="delivery-date-selection"]')
