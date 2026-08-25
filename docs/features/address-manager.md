# Address manager

Theme-owned address picker and create/edit form. Checkout confirm change buttons open a centered `Modal` with list → editor navigation. Account addressbook **create/edit pages** mount the same `Address:Editor`. Checkout register stays on Personal + Form inside `Account:Register`.

Core Address Manager (`data-address-manager`, `address-manager-modal*.html.twig`, `AddressManagerPlugin`, `/widgets/account/address-manager`) is **not** used. Markup is served by theme routes under `/vi/address/…` via `renderComponent()`.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Address:Manager:Action` | Confirm change buttons. Lazy fetch/mount/unmount; `aria-expanded` / `aria-haspopup="dialog"`. Options: `managerUrl`, `editorUrl`, `tab` (`shipping` \| `billing`), `hideShipping`. Public `open()` / `close()` |
| `Address:Manager` | Class-backed view-model (current vs available per tab, active/default ids, `hideShipping`). Owner JS: select, search is on List, create/edit, set-default, switch, editor submit, tab change |
| `Address:Manager:View` | Panel island identity (`mode=list` \| `editor`). Inner fetch swaps this root — Modal is not remounted |
| `Address:Manager:Pane` | Current card + available `List` for one type |
| `Address:Manager:List` | Toolbar (search `input[type="search"]` + create), available items, empty / no-results `Status`. Client-side text filter |
| `Address:Manager:Item` | Selectable card: radio + [`Address`](address.md) + `Badge` “Standard” + `Dropdown` (edit, set default). **No delete**. Shipping unavailable → radio disabled. Click (not dropdown) → Manager `select(id, type)` |
| `Address:Manager:Create` / `:Edit` / `:Default` / `:Back` / `:Dismiss` | `callMethod` / closest Manager or `Modal.close` |
| `Address:Editor` | Form SoT: `Address:Personal` + `Address:Form` + `Form:Handler`. Hidden `address[id]` when editing. Nested `hidden` / `fields` / `hint` / `actions` |
| `Modal` | Centered card dialog: open/close, backdrop, Escape, Tab trap, body lock. Not Drawer / Search overlay / Gallery fullscreen |
| `Modal:Panel` / `:Header` / `:Close` | Header + scroll body + footer slots; Close → `callMethod('ViewsTheme:Modal', 'close')` |

Do **not** add `data-component` on `Checkout:Confirm`. Addressbook **listing** page stays `Address:Item` / `ItemActions` (out of scope). Display pair chrome is [`Address:List`](address.md).

## Composition

Confirm change:

```
Checkout:Confirm:Addresses → Address:List
    └─ Address:Manager:Action   (shipping and/or billing)
```

Lazy shell (body mount):

```
Address:Manager
└─ Modal #vi-address-manager
     └─ Modal:Panel
          └─ Address:Manager:View     (island)
               ├─ Modal:Header
               ├─ body: list XOR editor
               │    ├─ list: Tabs (unless hideShipping) → Pane → current Item + List
               │    └─ editor: Address:Editor (preventNative, showActions=false)
               └─ footer
                    ├─ list: Dismiss + Form:Handler switch POST
                    └─ editor: Back + submit (form="vi-address-editor")
```

```
Address:Editor
└─ Form:Handler
     ├─ hidden address[id] (edit)
     ├─ Address:Personal
     ├─ Address:Form
     └─ actions (account pages only)
```

## Features

- Confirm shipping / billing change opens the themed modal on the matching tab
- Digital cart (`hideShipping`): billing-only pane, no shipping tab
- Search filters available cards client-side (empty vs no-results copy)
- Select + “Adresse ändern” POSTs `/vi/address/switch` → **204** → `location.reload()`
- Create / edit loads `/vi/address/editor` into the View island (valid save → 204 + reload; violations → **4xx HTML** swap)
- Set default POSTs core `frontend.account.address.switch-default` (`redirect: 'manual'`; opaque/status 0 is success), then refetches GET manager into the island
- Guest checkout allowed (login required + guest)
- Addressbook create/edit: same Editor, native submit to `frontend.account.address.create` / `.edit.save`
- Escape / backdrop / close unmounts the shell; reopen always refetches
- Two confirm Actions: only the Action that mounted handles Close (`contains` Modal el); opening the other Action emits `Modal:Close` on the live shell so its owner clears `aria-expanded` and unmounts, then the new shell mounts

## How it works

### Open flow

1. `Address:Manager:Action` reads `managerUrl` / `tab` / `hideShipping` from `data-component-options`
2. **Click:** if this Action’s Modal is open → `close()`; else `open()`
3. **`open()`:** close a foreign Manager shell if present; **always** GET `frontend.views-theme.address.manager` (`tab`, `hideShipping=1` when set); `AbortController`; stale responses ignored
4. Response root is `ViewsTheme:Address:Manager`; Action `replaceMount`s onto `document.body` and calls Modal `open()`
5. Modal emits `ViewsTheme:Modal:Open` `{ el }`; Action sets `aria-expanded`
6. On `ViewsTheme:Modal:Close` `{ el }`: owning Action (Modal el inside `_managerEl`) sets `aria-expanded`, restores focus, **removes** the Manager root
7. Action `destroy()` aborts in-flight fetch and unmounts any open shell

Fallback `href` on the Action Button is `frontend.account.address.edit.page` (no-JS).

### Inner navigation (island)

Modal stays mounted. Manager JS fetches HTML and replaces `[data-component="ViewsTheme:Address:Manager:View"]`.

| Intent | HTTP | Result |
|--------|------|--------|
| Create | `GET /vi/address/editor?type=` | View `mode=editor` |
| Edit | `GET /vi/address/editor?type=&addressId=` | View `mode=editor` |
| Back | `GET /vi/address/manager?tab=&hideShipping=` | View `mode=list` |
| Editor submit (ok) | `POST /vi/address/editor` | **204** → `location.reload()` |
| Editor submit (violations) | `POST /vi/address/editor` | **4xx** View HTML → swap |
| Switch | `POST /vi/address/switch` | **204** → `location.reload()` |
| Set default | `POST frontend.account.address.switch-default` (`redirect: 'manual'`) | opaque/302 counts as success, then GET manager → swap |

JS selectors: `[data-component="ViewsTheme:Address:…"]`, `input[type="search"]`, `button[type="submit"]`, form ids. Never `.address-manager-*`.

`Form:Handler:Submit` is how Manager receives switch / editor POSTs (`preventNative=true`). Same pattern as `Review:Form`.

### Address:Editor

| Prop | Default | Notes |
|------|---------|--------|
| `action` | required | Account routes or `/vi/address/editor` |
| `data` / `postedData` | | Entity, bag, or posted array |
| `page` / `formViolations` | | |
| `typePrefix` | `''` | Field id prefix (`shipping` / `billing` in the modal) |
| `formId` | `vi-address-editor` | Footer submit uses `form=` |
| `preventNative` | `false` | `true` in the modal |
| `showActions` | `true` | `false` in the modal (footer owns buttons) |
| `submitLabel` | `account.addressSaveChange` | Modal: save vs save-and-use |

Checkout **register** does **not** mount Editor (credentials / shipping toggle stay on `Account:Register`).

### Controller

| Route name | Path | Method | Renders |
|------------|------|--------|---------|
| `frontend.views-theme.address.manager` | `/vi/address/manager` | GET (XHR) | `ViewsTheme:Address:Manager` |
| `frontend.views-theme.address.editor` | `/vi/address/editor` | GET (XHR) | `ViewsTheme:Address:Manager:View` (editor) |
| `frontend.views-theme.address.editor.save` | `/vi/address/editor` | POST (XHR) | **204** + flash, or **422** editor View |
| `frontend.views-theme.address.switch` | `/vi/address/switch` | POST (XHR) | **204** + flash |

Login required + **guest allowed**. After `AddressListingPageLoader`, fire `AddressBookWidgetLoadedHook` (`address-book-widget-loaded`). Upsert via `AbstractUpsertAddressRoute`; on success switch context for that `type` (core `handleAddressCreation` parity). Switch uses `AbstractContextSwitchRoute` (empty shipping/billing ids stripped). Render via `AbstractComponentController::renderComponent()`.

Do **not** keep `/widgets/account/address-manager`.

See [architecture — data + App hooks](../architecture.md#theme-xhr-controllers-data-app-hooks).

## Modal primitive

Centered card (header + scroll body + footer). Drawer / Search overlay / Gallery fullscreen stay as-is.

| Piece | Role |
|-------|------|
| `Modal` | `role="dialog"`, `aria-modal`, `inert` / `aria-hidden`, `data-open`, body lock, Escape, Tab trap, `ViewsTheme:Modal:Open` / `:Close` `{ el }` |
| `Modal:Panel` | slots `header` / `body` / `footer`; body `min-h-0` + overflow |
| `Modal:Close` | `callMethod('ViewsTheme:Modal', 'close')` |
| `Backdrop` | `componentName="ViewsTheme:Modal"` |

Layout: fixed overlay (`d-flex` / `d-none`), centered panel. Tokens: `--vi-modal-width`, `--vi-modal-max-h`, `--vi-modal-duration`, `--vi-modal-z`. Co-located `Modal.css` for overlay/centering/motion only; CVA for flex chrome.

Shared Tab trap: `@views-theme/modules/shared/focus-trap.js` (`trapFocus`) — also Drawer, Search Overlay, Gallery Fullscreen.

Action owns fetch/mount/unmount; Modal only open/closes. See [JS lazy-loaded shells](../conventions/javascript.md#lazy-loaded-shells-critical).

## Files

`components/Modal.*` · `components/Modal/{Panel,Header,Close}.*` · `components/Address/Editor.*` · `components/Address/Manager.*` · `components/Address/Manager/{Action,View,Pane,List,Item,Status,Create,Edit,Default,Back,Dismiss}.*` · `src/Controller/AddressManagerController.php` · `storefront/page/account/addressbook/{create,edit}.html.twig` · `src/Resources/app/storefront/src/modules/shared/focus-trap.js`

## Out of scope

- Addressbook **listing** page owner
- Migrating Search overlay / Gallery fullscreen onto `Modal`
- Account overview / edit-order address chrome
- Core plugin unregister (unused once confirm stops emitting `data-address-manager`)

## Related

- [Address](address.md)
- [Checkout confirm](checkout-confirm.md)
- [Checkout register](checkout-register.md)
- [Form input](form-input.md)
- [Tabs](tabs.md)
- [JavaScript](../conventions/javascript.md)
- [Architecture](../architecture.md)
