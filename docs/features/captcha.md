# Captcha

Theme-owned wrapper around Shopware's captcha APIs. It replaces the legacy `storefront/component/captcha/base.html.twig` include. Nothing changes in behaviour: it reads the same system config, posts the same request parameters, and keeps the DOM hooks the core captcha JS plugins bind to.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Captcha` (class-backed) | View-model. `#[PostMount]` reads `core.basicInformation.activeCaptchasV2` (sales-channel aware, `SystemConfigService`) and maps every active entry to a `CaptchaEntry` (`type`, `component`, `slot`, `props`, `visible`) in config order. It also builds `captchaFormId` (`form-{formId}`; `formId` defaults to a random id, same as core) and `hidden`. Twig loops `captchas` and renders `{{ component(captcha.component, …) }}` — no per-type `if`s. Renders nothing when none is active. When no entry is visible (honeypot only) `hidden` is true and the root gets the CVA variant `hidden` (`d-none`), so it adds no gap to the parent flex column; the honeypot input stays in the form |
| `Captcha:Basic` | Basic image captcha: `data-basic-captcha` + options JSON, image / refresh / field ids, `Form:Input` named `BasicCaptcha::CAPTCHA_REQUEST_PARAMETER`, hidden `formId` input, refresh `Button` |
| `Captcha:Honeypot` | `HoneypotCaptcha::CAPTCHA_REQUEST_PARAMETER` input (`d-none`, `tabindex=-1`, `autocomplete=new-password`) in a wrapper carrying the parameter name as a class |
| `Captcha:GoogleReCaptchaV2` | `data-google-re-captcha-v2` + `siteKey` / `invisible`, hidden `_grecaptcha_v2` input, widget container, data-protection note (invisible and no V3), feedback |
| `Captcha:GoogleReCaptchaV3` | `data-google-re-captcha-v3` + `siteKey`, hidden `_grecaptcha_v3` input, data-protection note, feedback |
| `Captcha:Legacy` | Fallback for captcha types without a theme component (`sw_include` of the core template) |

`Captcha` is class-backed; the children are anonymous and take their props (`formId`, `siteKey`, `invisible`, `protection`) from the entry. None has a `data-component` or theme JS. The core captcha PluginManager plugins (`BasicCaptchaPlugin`, `GoogleReCaptchaV2/V3Plugin`) still own the behaviour.

## Contract with the core plugins

These hooks are part of the core API, so they are hard-coded in the templates — not CVA — and must not be removed:

| Hook | Where |
|------|-------|
| `data-basic-captcha`, `data-basic-captcha-options` (`router`, `validate`, `captchaRefreshIconId`, `captchaImageId`, `basicCaptchaInputId`, `basicCaptchaFieldId`, `invalidFeedbackMessage`, `formId`, `preCheckRoute`) | `Captcha:Basic` root |
| `#{formId}-basic-captcha-content-image` / `-content-refresh-icon` / `-input` / `-field` | `Captcha:Basic`. The plugin fetches `frontend.captcha.basic-captcha.load` and replaces the **inner HTML** of the image element |
| hidden `formId` input | `Captcha:Basic` — the server matches it against the session |
| `data-google-re-captcha-v2` / `-v3` + `-options` | root |
| `.grecaptcha-v2-input` / `.grecaptcha-v2-container` / `.grecaptcha_v3-input`, `data-validation="grecaptcha"`, `data-validate-hidden` | child elements |

Unknown keys (captchas added by plugins) map to `Captcha:Legacy`, which includes `storefront/component/captcha/{type}.html.twig` via `sw_include … ignore missing` with `formId`, so third-party captchas keep working. Adding a theme-owned type is one `match` arm in `Captcha::entry()` plus a child component.

## Callers

| Caller | Notes |
|--------|-------|
| `Account:Register` | `captcha` nest (`vi_attrs('captcha')`); the Register CVA gives it the section padding |
| `Account:Convert` | `<twig:ViewsTheme:Captcha />` |
| `Newsletter:Form` | `:formId="id"` — the JSON POST override keys off `[data-basic-captcha]` / `[data-google-re-captcha-*]`, see [newsletter](newsletter.md#captcha) |

## Related

- [Checkout register](checkout-register.md)
- [Newsletter](newsletter.md)
- [Form input](form-input.md)
