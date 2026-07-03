import Plugin from 'src/plugin-system/plugin.class'

export default class CartPlugin extends Plugin {
  static options = {
    badgeClass: 'badge bg-primary',
  }

  init() {
    this._renderBadge()
    this._registerEvents()
  }

  /**
   * Render the cart count badge inside the cart button.
   */
  _renderBadge() {
    const count = window.cartCount || 0
    let badge = this.el.querySelector(`.${this.options.badgeClass.replace(/\s+/g, '.')}`)

    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span')
        badge.className = this.options.badgeClass
        this.el.appendChild(badge)
      }
      badge.textContent = count
      badge.setAttribute('data-component', 'header-badge-cart')
    } else if (badge) {
      badge.remove()
    }
  }

  /**
   * Subscribe to core cart plugin events for live updates.
   */
  _registerEvents() {
    this._subscribeToPlugin('CartWidget', 'fetch', this._onCartChanged.bind(this))
    this._subscribeToPlugin('OffCanvasCart', 'fetchCartWidgets', this._onCartChanged.bind(this))
    this._subscribeToPlugin('AddToCart', 'addToCartWithoutOffcanvas', this._onCartChanged.bind(this))
  }

  /**
   * Subscribe to a specific event on all instances of a plugin.
   */
  _subscribeToPlugin(pluginName, eventName, callback) {
    const instances = window.PluginManager.getPluginInstances(pluginName)
    if (!instances) {
      return
    }

    instances.forEach((instance) => {
      if (instance.$emitter) {
        instance.$emitter.subscribe(eventName, callback)
      }
    })
  }

  /**
   * Handler called whenever the cart is mutated.
   */
  _onCartChanged() {
    this._fetchCartCount()
  }

  /**
   * Fetch the current cart count via the lightweight JSON endpoint
   * and update both the DOM badge and window.cartCount.
   */
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
        const count = data.lineItems ? data.lineItems.length : 0
        window.cartCount = count
        this._renderBadge()
      })
      .catch(() => {
        // Silently ignore fetch errors.
      })
  }
}
