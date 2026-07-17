# Component template conventions

## Target standard (UX)

New and migrated components under `src/Resources/views/components/` use **Shopware UX Twig components**.

Full guide: [UX Twig components](ux-components.md).

Summary:

1. PascalCase path → `<twig:ViewsTheme:…>`
2. `{% props %}` for inputs
3. `cva()` + `attributes` / `attributes.nested()` for classes (BEM `vi-*` roots)
4. Short `{% block %}` names
5. Interactive root: `data-component="ViewsTheme:…"`; internal hooks: `data-ref="…"`
6. Optional co-located `index.js` (`ShopwareComponent`)

## Legacy standard (until migrated)

Unmigrated components still use:

1. `vi_define_classes` + `vi_attr_classes` / `vi_classes`
2. `{% sw_include '@Storefront/components/…' %}`
3. Kebab-case paths

See [CSS class API](css-classes.md). Prefer **not** adding new legacy components.

| Pattern | Status |
|---------|--------|
| UX + CVA + attributes | **Required for new / migrated components** |
| `vi_define_classes` / `vi_attr_classes` | Legacy only; hard-remove after full migration |
| Shell / router templates | May stay thin until their domain migrates |
| `icon` helper (`vi_icon`) | Kept (not a class-map component) |

## Related

- [UX components](ux-components.md)
- [CSS class API](css-classes.md)
- [JavaScript](javascript.md)
