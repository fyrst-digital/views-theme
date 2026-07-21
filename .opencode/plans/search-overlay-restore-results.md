# Search Overlay: restore results on reopen (fixup)

## Why the first fix failed

Source + built bundle (`Bar-5Xmlv6T1.js`) already contain the previous change. Behavior still broken because of an **event-order race on the Search Action click**.

### Reopen via header Search Action (reported path)

1. User dismisses overlay (backdrop/close). With the first fix, suggest DOM is **kept**.
2. User clicks `ViewsTheme:Search:Action` (outside the overlay).
3. **Bubble order on that same click:**
   - Action handler → `overlay.open()` → dispatches `ViewsTheme:Search:Overlay:open`
   - Bar `_onOverlayOpen` sees `_resultsEl` still set → **early return, no fetch**
   - Event reaches `document` → Bar `_onDocumentClick` → target is Action → **not** inside overlay → `_clearResults()`
4. Result: input still has `"fan"`, results gone. Looks like “nothing changed.”

Same clear also runs when **closing** by toggling the Action while open (Action is outside overlay).

Skipping clear only for clicks *inside* the overlay was incomplete: the control that reopens search lives **outside**.

```
Action click (outside overlay)
  ├─ open() → Overlay:open → Bar skips restore (_resultsEl exists)
  └─ document click → Bar clears results   ← bug
```

## Fix (Bar.js only)

### 1. Remove click-outside clearing for overlay Bar

`_onDocumentClick` is classic dropdown UX and does not fit a full-viewport modal. Bar is only used inside `Search:Overlay`.

- **Remove** the `document` `click` listener and `_onDocumentClick` entirely.
- Overlay open/close already hides the panel; keeping suggest DOM while closed is correct.

### 2. Harden restore on `ViewsTheme:Search:Overlay:open`

```js
_onOverlayOpen(event) {
    const overlay = event.target
    if (!(overlay instanceof Element) || !overlay.contains(this.el)) {
        return
    }

    // Drop stale ref if node was removed externally
    if (this._resultsEl && !this._resultsEl.isConnected) {
        this._resultsEl = null
    }

    const term = this._input.value.trim()
    if (term.length < this.options.minChars) {
        return
    }

    if (this._resultsEl) {
        return // already visible under overlay
    }

    void this._fetchSuggest(term)
}
```

After (1), preserved results survive Action reopen. After a path that left no results, open re-fetches.

### 3. Docs

Update `docs/features/search-overlay.md`:

- Suggest is not torn down on overlay dismiss / Action toggle.
- On open, missing results are restored from the current input term.

## Files

| File | Change |
|------|--------|
| `src/Resources/views/components/Search/Bar.js` | Remove document-click clear; harden `_onOverlayOpen` |
| `docs/features/search-overlay.md` | Correct close/restore notes |

No Overlay/Action/template changes.

## Verification

1. Type `fan` → results show.
2. Dismiss backdrop → reopen via Action → **results still there** (no flash/refetch required).
3. Close via Action toggle while open → reopen → results restored (kept in DOM or re-fetched).
4. Escape close → reopen → results present.
5. Clear input below `minChars` → results cleared by input handler; reopen → no results.
6. Hard-refresh if browser cached an older hashed `Bar-*.js` (current build hash: check `public/.../manifest.json`).

## Out of scope

- Prefetch/cache of last HTML blob
- Clearing input on close
