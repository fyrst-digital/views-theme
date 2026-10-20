# Address manager

Theme-owned address picker and create/edit form. Checkout confirm change buttons open a centered `Modal` with list → editor navigation. Account addressbook **create/edit pages** mount the same `Address:Editor`. Checkout register stays on Personal + Form inside `Account:Register`.

Core Address Manager (`data-address-manager`, `address-manager-modal*.html.twig`, `AddressManagerPlugin`, `/widgets/account/address-manager`) is **not** used. Markup is served by theme routes under `/vi/address/…` via `renderComponent()`.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Address:Manager:Action` | Confirm change buttons. Lazy fetch/mount/unmount; `aria-expanded` / `aria-haspopup="dialog"`. Options: `managerUrl`, `editorUrl`, `tab` (`shipping` \| `billing`), `hideShipping`. Public `open()` / `close()` |
| `Address:Manager` | Class-backed view-model (current vs available per tab, active/default ids, `hideShipping`). Owner JS: select, search is on List, create/edit, set-default, switch, editor submit, tab change |
| `Address:Manager:View` | Panel body island (`mode=list` \| `editor`). Inner fetch swaps this root — Modal is not remounted |
| `Address:Manager:Pane` | Selected address + available `List` for one type. No pane heading. Mounts `Address:Manager:Item:Hero` for the address in use |
| `Address:Manager:List` | Full-width search (`input[type="search"]`), available rows, empty / no-results `Status`. Client-side text filter. Create lives in the footer |
| `Address:Manager:Item` | Class-backed view-model (display lines, default flag, shipping block). One `Form:Selection` radio: name, `street, zip city`, trailing “Default” or “use as default”. **No delete, no Dropdown**. Shipping unavailable → radio disabled, warning below the selection. Click (not Edit / Default) → Manager `select(id, type)`, which checks that item’s radio |
| `Address:Manager:Item:Hero` | Current-address face. Mounts `Item` and overrides `label` (Default badge or use-as-default, then the name), `description` (lines and Edit), and an empty `trailing` |
| `Address:Manager:Create` / `:Edit` / `:Default` / `:Back` / `:Dismiss` | `callMethod` / closest Manager or `Modal.close`. Create follows the active tab |
| `Address:Editor` | Form SoT: `Address:Personal` + `Address:Form` + `Form:Handler`. `layout` `page` (default) or `manager` (modal only). Hidden `address[id]` when editing. Nested `hidden` / `fields` / `hint` / `actions` |
| `Modal` | Centered card dialog: open/close, backdrop, Escape, Tab trap, body lock. Not Drawer / Search overlay / Gallery fullscreen |
| `Modal:Panel` / `:Header` / `:Close` | Header + scroll body + footer slots; Close → `callMethod('ViewsTheme:Modal', 'close')` |

Do **not** add `data-component` on `Checkout:Confirm`. Addressbook **listing** page is [`Account:Addressbook`](account.md) (`Address:Item` / `ItemActions`). Display pair chrome is [`Address:List`](address.md).

## Composition

Confirm change:

```
Checkout:Confirm:Addresses   (class VM)
    └─ Address:Manager:Action   (shipping and/or billing)
```

Lazy shell (body mount):

```
Address:Manager
└─ Modal #vi-address-manager
     └─ Modal:Panel          (title prop → Modal:Header; actions block is the footer)
          ├─ header: title (list: addressChoose; editor: addressAdd / addressEditWelcome)
          ├─ body: Address:Manager:View
          │    ├─ list: Tabs:List (unless hideShipping) + scroll body → Pane
          │    └─ editor: Address:Editor layout=manager (preventNative, showActions=false, showHint=false)
          └─ actions
               ├─ list: Dismiss + Create + Form:Handler switch POST (Apply)
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

- Confirm shipping / billing change opens the themed modal on the matching tab. Title is `viewsTheme.account.addressChoose`
- Tabs sit under the title (underline is manager `View.css` on `[aria-selected]`, not a global Tabs change). Digital cart (`hideShipping`): billing-only pane, no tabs
- The current address stays in place. `Item:Hero` fills its `label` (Default badge or use-as-default, then the name), `description` (lines and Edit), and an empty `trailing`. Choosing a row checks that row’s radio, unchecks the previous one, and updates the switch hidden input. Selected fill and border follow the checked radio. Edit is only on the current address
- Search filters rows inside `List` (the address in use stays). Empty vs no-results `Status` stay
- Apply POSTs `/vi/address/switch` → **204** → `location.reload()`
- Footer **New address** / current-address **Edit** load `/vi/address/editor` (valid save → 204 + reload; violations → **4xx HTML** swap). The response is a full Manager. JS swaps the View island and copies the panel title and footer actions onto the open modal. Editor title is `viewsTheme.account.addressAdd` or `account.addressEditWelcome`. Submit label is `account.addressSaveChange`
- Set default POSTs core `frontend.account.address.switch-default` (`redirect: 'manual'`; opaque/status 0 is success), then refetches GET manager into the island. Already-default rows show “Default” instead of the action
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

Modal stays mounted. Manager JS fetches HTML, replaces `[data-component="ViewsTheme:Address:Manager:View"]`, and copies the response panel `h1` plus footer children onto the open panel.

| Intent | HTTP | Result |
|--------|------|--------|
| Create | `GET /vi/address/editor?type=` | Manager `mode=editor` |
| Edit | `GET /vi/address/editor?type=&addressId=` | Manager `mode=editor` |
| Back | `GET /vi/address/manager?tab=&hideShipping=` | Manager `mode=list` |
| Editor submit (ok) | `POST /vi/address/editor` | **204** → `location.reload()` |
| Editor submit (violations) | `POST /vi/address/editor` | **4xx** Manager HTML → swap |
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
| `showHint` | `true` | `false` in the modal (no “required fields” line) |
| `layout` | `page` | `manager` only from the modal. Stacks salutation, name, street, zip \| city (country arrangement; state stays its own row), country, phone. Account create/edit and checkout register stay on the 6-column grid |
| `submitLabel` | `account.addressSaveChange` | Modal uses the same label |

Checkout **register** does **not** mount Editor (credentials / shipping toggle stay on `Account:Register`). Account address create/edit mount Editor without `layout` (page grid).

### Controller

| Route name | Path | Method | Renders |
|------------|------|--------|---------|
| `frontend.views-theme.address.manager` | `/vi/address/manager` | GET (XHR) | `ViewsTheme:Address:Manager` |
| `frontend.views-theme.address.editor` | `/vi/address/editor` | GET (XHR) | `ViewsTheme:Address:Manager` (editor) |
| `frontend.views-theme.address.editor.save` | `/vi/address/editor` | POST (XHR) | **204** + flash, or **422** editor Manager |
| `frontend.views-theme.address.switch` | `/vi/address/switch` | POST (XHR) | **204** + flash |

Login required + **guest allowed**. After `AddressListingPageLoader`, fire `AddressBookWidgetLoadedHook` (`address-book-widget-loaded`). Upsert via `AbstractUpsertAddressRoute`; on success switch context for that `type` (core `handleAddressCreation` parity). Switch uses `AbstractContextSwitchRoute` (empty shipping/billing ids stripped). Render via `AbstractComponentController::renderComponent()`.

Do **not** keep `/widgets/account/address-manager`.

See [architecture — data + App hooks](../architecture.md#theme-xhr-controllers-data-app-hooks).

## Modal primitive

Centered card (header + scroll body + footer). Drawer / Search overlay / Gallery fullscreen stay as-is.

| Piece | Role |
|-------|------|
| `Modal` | `role="dialog"`, `aria-modal`, `inert` / `aria-hidden`, `data-open`, body lock, Escape, Tab trap, `ViewsTheme:Modal:Open` / `:Close` `{ el }` |
| `Modal:Panel` | slots `header` / `body` / `footer`. `title` feeds `Modal:Header`. Footer contains the `actions` block. Panel is `overflow-hidden` inside `--vi-modal-max-h`. Slot body is the scrollport (`overflow-y-auto`) unless a caller overrides it |
| `Modal:Close` | `callMethod('ViewsTheme:Modal', 'close')` |
| `Backdrop` | `componentName="ViewsTheme:Modal"` |

Address manager keeps the panel header and footer. Its body override is `overflow-hidden` (not the scrollport). `Address:Manager:View` fills that body: an `overflow-hidden` flex column. List mode’s tabs wrapper is the same kind of column. The view body is the only `overflow-y-auto` scrollport. Header and footer stay `flex-shrink-0`, so the footer stays pinned while the body scrolls.

Shared card chrome (pen): `rounded-5`, linen `border`, `--vi-modal-shadow` (`0 10px 28px`), header `pt-7 px-7` with `fs-2` title, close `--vi-modal-close-size` (32px), footer inset `px-7 pt-6 pb-7`. Address manager footer is `justify-content-between`. An empty footer (`:not(:has(*))`) is hidden.

Layout: fixed overlay (`d-flex` / `d-none`), centered panel. Tokens: `--vi-modal-width`, `--vi-modal-max-h`, `--vi-modal-duration`, `--vi-modal-z`, `--vi-modal-shadow`, `--vi-modal-close-size`. Co-located `Modal.css` for overlay, shadow, close size, and motion; CVA for flex chrome.

Shared Tab trap: `@views-theme/modules/shared/focus-trap.js` (`trapFocus`) — also Drawer, Search Overlay, Gallery Fullscreen.

Action owns fetch/mount/unmount; Modal only open/closes. See [JS lazy-loaded shells](../conventions/javascript.md#lazy-loaded-shells-critical).

## Files

`components/Modal.*` · `components/Modal/{Panel,Header,Close}.*` · `components/Address/Editor.*` · `components/Address/Manager.*` · `components/Address/Manager/{Action,View,Pane,List,Item,Status,Create,Edit,Default,Back,Dismiss}.*` · `src/Controller/AddressManagerController.php` · `storefront/page/account/addressbook/{create,edit}.html.twig` · `src/Resources/app/storefront/src/modules/shared/focus-trap.js`

## Out of scope

- Migrating Search overlay / Gallery fullscreen onto `Modal`
- Core plugin unregister (unused once confirm stops emitting `data-address-manager`)

## Related

- [Address](address.md)
- [Account pages](account.md)
- [Checkout confirm](checkout-confirm.md)
- [Checkout register](checkout-register.md)
- [Form input](form-input.md)
- [Tabs](tabs.md)
- [JavaScript](../conventions/javascript.md)
- [Architecture](../architecture.md)
