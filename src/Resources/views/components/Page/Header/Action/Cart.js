export default class HeaderActionCart extends ShopwareComponent {
  static options = {
    badgeClass: 'badge bg-primary',
    badgeRef: 'badge',
  }

  init() {
    this._onCartChanged = this._onCartChanged.bind(this)
    this._renderBadge()
    this._registerEvents()
  }

  destroy() {
    this._unregisterEvents()
  }

  _renderBadge() {
    const count = window.cartCount || 0
    const badgeSelector = `.${this.options.badgeClass.replace(/\s+/g, '.')}`
    let badge = this.el.querySelector(badgeSelector)

    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span')
        badge.className = this.options.badgeClass
        badge.setAttribute('data-ref', this.options.badgeRef)
        this.el.appendChild(badge)
      }
      badge.textContent = String(count)
    } else if (badge) {
      badge.remove()
    }
  }

  _registerEvents() {
    this._subscriptions = []
    this._subscribeToPlugin('CartWidget', 'fetch', this._onCartChanged)
    this._subscribeToPlugin('OffCanvasCart', 'fetchCartWidgets', this._onCartChanged)
    this._subscribeToPlugin('AddToCart', 'addToCartWithoutOffcanvas', this._onCartChanged)
  }

  _unregisterEvents() {
    if (!this._subscriptions) {
      return
    }

    this._subscriptions.forEach(({ emitter, eventName, callback }) => {
      if (emitter && typeof emitter.unsubscribe === 'function') {
        emitter.unsubscribe(eventName, callback)
      }
    })
    this._subscriptions = []
  }

  _subscribeToPlugin(pluginName, eventName, callback) {
    const pluginManager = window.PluginManager
    if (!pluginManager || typeof pluginManager.getPluginInstances !== 'function') {
      return
    }

    const instances = pluginManager.getPluginInstances(pluginName)
    if (!instances) {
      return
    }

    instances.forEach((instance) => {
      if (instance.$emitter) {
        instance.$emitter.subscribe(eventName, callback)
        this._subscriptions.push({
          emitter: instance.$emitter,
          eventName,
          callback,
        })
      }
    })
  }

  _onCartChanged() {
    this._fetchCartCount()
  }

  _fetchCartCount() {
    fetch('/checkout/cart.json?includes[cart][]=lineItems&includes[line_item][]=id', {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Cart fetch failed')
        }
        return response.json()
      })
      .then((data) => {
        window.cartCount = data.lineItems ? data.lineItems.length : 0
        this._renderBadge()
      })
      .catch(() => {
        // Silently ignore fetch errors.
      })
  }
}
