/**
 * Minimal ambient types for Shopware storefront component system (IDE / checkJs).
 */

declare class ShopwareComponent {
    static options: Record<string, unknown>
    el: HTMLElement
    options: Record<string, unknown>
    componentName: string
    init(): void
    destroy(): void
}

interface ShopwareGlobal {
    emit(eventName: string, ...args: unknown[]): void
    emitQueued(eventName: string, ...args: unknown[]): void
    on(eventName: string, callback: (...args: unknown[]) => void): void
    off(eventName: string, callback: (...args: unknown[]) => void): void
    callMethod(componentName: string | RegExp, methodName: string, ...args: unknown[]): void
    getComponentInstances(componentName: string | RegExp): ShopwareComponent[]
    getComponentInstanceByElement(componentName: string, element: Node): ShopwareComponent | undefined
    serializeForm(form: HTMLFormElement): FormData
    serializeFormJson(form: HTMLFormElement): Record<string, FormDataEntryValue>
}

interface Window {
    Shopware: ShopwareGlobal
    /** Theme viewport px map (`theme_config('breakpoint.*')`) — keys `xs`–`xxl`. */
    breakpoints?: Record<string, number>
    focusHandler: {
        getFocusableElements(root: Element): HTMLElement[]
        setFocus(el: Element, options?: { focusVisible?: boolean }): void
    }
    cartCount?: number
    wishlistCount?: number
    wishlistProducts?: Record<string, unknown>
    activeNavigationId?: string
    activeNavigationPathIdList?: string[]
    /** Core cookie consent switch (`core.basicInformation.useDefaultCookieConsent`). */
    useDefaultCookieConsent?: boolean
    /** Core reCAPTCHA gate, re-run once the cookie preference changes. */
    registerGoogleReCaptchaPlugins?: () => void
    PluginManager?: { initializePlugins(): void }
}

interface Document {
    /** Core global event emitter (`CookieConfiguration_Update`, …). */
    $emitter?: { publish(eventName: string, detail?: unknown): void }
}

declare const ShopwareComponent: {
    new (): ShopwareComponent
    options: Record<string, unknown>
}
