# Component showcase

Storefront pages that render existing ViewsTheme components for local inspection. Available only when `APP_ENV=dev`.

## Dev-only contract

| Piece | When it loads |
|-------|----------------|
| `src/Resources/config/routes_dev.xml` | Kernel environment `dev` (`Bundle::configureRoutes`) |
| `src/Resources/config/services_dev.xml` | `ViewsTheme::build()` when `kernel.environment` is `dev` |
| `src/Controller/Dev/` | Imported by `routes_dev.xml` only. `routes.xml` excludes this directory |

In any other environment the route is not registered and the controller service does not exist.

Responses set meta robots to `noindex,nofollow` and the `x-robots-tag: noindex` header.

## Forms

| | |
|--|--|
| Route | `frontend.views-theme.components.forms` |
| Path | `/vi/components/forms` |
| Controller | `ComponentShowcaseController::forms` |
| Template | `storefront/page/showcase/forms.html.twig` |

The page extends the storefront base layout and mounts components in `base_content`. `base_esi_header` and `base_esi_footer` are empty, so the storefront header and footer are not rendered. There is no showcase UX component.

One `Form:Handler` (`method="get"`, action is this route) so an invalid submit stays on the page and a valid submit reloads it.

| Section | Components |
|---------|------------|
| Input | `Form:Input` — text, required email, password + `confirmFor`, sizes `sm` / `md` / `lg`, disabled, `error`, `success`, description |
| Input group | `Form:Input:Group` with prepend text and a primary `Button` append |
| Textarea | `Form:Textarea` |
| Select | `Form:Select` stacked `:options` and `layout="bar"` |
| Checkbox | `Form:Checkbox` — default, checked, disabled, error |
| Radio | `Form:Radio` — default, checked, disabled |
| Selection | `Form:Selection` — `type` `radio` and `checkbox`, unchecked and checked, with price |
| Switch | `Form:Switch` default and `reverse` |
| Slider | `Form:Slider` `single` and `range` |
| Birthday | `Form:Birthday` |
| Toggle | `Form:Toggle` — switch reveals a required textarea |
| Quantity | `QuantityInput` |

Feature forms (`Address`, `Newsletter`, `Review`, checkout method) are not on this page.

Further sections are additional actions on `ComponentShowcaseController`, each with its own page template under `storefront/page/showcase/`.

## Related

- [Form input](form-input.md)
- [Architecture](../architecture.md)
