import Plugin from 'src/plugin-system/plugin.class';

export default class ExamplePlugin extends Plugin {
    static options = {
        selector: '.js-example'
    };

    init() {
        this._registerEvents();
    }

    _registerEvents() {
        this.el.addEventListener('click', this._onClick.bind(this));
    }

    _onClick(event) {
        console.log('ViewsTheme ExamplePlugin clicked', event);
    }
}
