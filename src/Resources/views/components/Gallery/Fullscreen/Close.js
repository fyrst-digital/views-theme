import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class GalleryFullscreenClose extends ThemeComponent {
    static options = {
        overlayComponentName: 'ViewsTheme:Gallery:Fullscreen',
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.scope.on(this.el, 'click', this._onClick)
    }

    /**
     * @param {MouseEvent} event
     */
    _onClick(event) {
        event.preventDefault()
        window.Shopware.callMethod(this.options.overlayComponentName, 'close')
    }
}
