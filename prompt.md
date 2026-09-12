ignore the feature of generate , and instead of blog title and brief description , add acc to my app like title, summary , category , and instead of save blog , like my app create draft  and cancel button, content markdown as i show u use shadcn component resizable window and u just did emerald instead i want black

Update the **existing navigation/sidebar in my Groundwork app** to use a responsive navigation system. **Do not redesign the app or change the existing navigation structure/content unnecessarily.** Inspect the current implementation first and adapt the existing components/styles.

## Goal

I want the navigation to behave differently based on available screen width:

* **Large screens (`lg` and above):** keep the existing vertical sidebar with **icons + labels**.
* **Medium screens (`md`):** collapse the sidebar into a narrow **icon-only sidebar**.
* **Small screens (`sm` / mobile):** replace the vertical sidebar with a **single horizontal top navbar** containing:

  1. Groundwork logo/brand on the left
  2. Navigation icons in the middle
  3. Search on the right

The navigation should feel like **one responsive navigation system**, not three unrelated implementations.

## Small-screen navbar

For mobile/small screens, create a compact top navbar similar to:

```text
┌────────────────────────────────────────────┐
│ ◈ Groundwork   🏠  🌐  ⚙️  🖥  🗄  🔐   🔍 │
└────────────────────────────────────────────┘
```

### Layout

* Navbar stays at the top.
* Groundwork logo/brand stays on the **left**.
* Navigation icons occupy the available middle space.
* Search stays on the **right**.
* Keep everything on **one horizontal line**.
* Do NOT put the navigation into a hamburger menu by default.
* Do NOT use a drawer for the primary mobile navigation.
* Do NOT wrap navigation items onto a second line.

If all navigation icons cannot fit:

* Allow the navigation section to **horizontally scroll**.
* Do not shrink icons to unusable sizes.
* Do not overlap the logo or search.
* Keep the search control accessible.

## Responsive behavior

### Large (`lg+`)

Keep the current sidebar concept:

```text
┌────────────────┬──────────────────────┐
│ Groundwork     │                      │
│                │      Article         │
│ 🏠 Home       │                      │
│ 🌐 HTTP       │                      │
│ ⚙ Backend     │                      │
│ 🖥 Frontend   │                      │
│ 🗄 Database   │                      │
└────────────────┴──────────────────────┘
```

* Icons + labels.
* Preserve the current navigation hierarchy.
* Preserve existing active states.
* Preserve existing collapse/expand behavior if one already exists.

### Medium (`md`)

Use a narrow icon-only sidebar:

```text
┌──────┬──────────────────────────────┐
│  ◈   │                              │
│  🏠  │          Article             │
│  🌐  │                              │
│  ⚙️  │                              │
│  🖥  │                              │
│  🗄  │                              │
└──────┴──────────────────────────────┘
```

* Sidebar should be approximately `56–72px` wide.
* Hide text labels.
* Keep the same icons and navigation items.
* Add accessible `aria-label`s.
* Add tooltips for icons when appropriate.
* Clearly indicate the active navigation item.

### Small (`sm`)

Hide the vertical sidebar completely and render the horizontal top navbar.

```text
┌────────────────────────────────────────────┐
│ ◈ GW │ 🏠 🌐 ⚙️ 🖥 🗄 🔐 → │ 🔍            │
└────────────────────────────────────────────┘
```

On very narrow screens, use the actual Groundwork logo/mark rather than consuming space with the full "Groundwork" wordmark.

## Important implementation requirements

1. **Inspect the existing code first.**

   * Find the current sidebar/navigation component.
   * Find how navigation items, icons, active states, and routing are currently defined.
   * Reuse those instead of duplicating navigation data.

2. **Do not create three separate navigation systems.**

   * Keep one shared navigation data/configuration.
   * Reuse the same navigation items and routing.
   * Only change the presentation/layout at each breakpoint.

3. **Do not break existing routing.**

   * Existing links/routes must continue working exactly as before.
   * Preserve active route highlighting.

4. **Do not change the article/content layout unnecessarily.**

   * On mobile, the navbar should consume only the necessary vertical space.
   * The article should use the remaining viewport width.
   * Do not introduce unnecessary horizontal page overflow.

5. **Mobile navbar should remain visually stable.**

   * Logo left.
   * Navigation icons center.
   * Search right.
   * Use flexbox/grid appropriately.
   * Navigation area may scroll horizontally.
   * Search should remain visible instead of being pushed off-screen.

6. **Accessibility**

   * Every icon-only navigation item must have an accessible name.
   * Use `aria-label` where there is no visible label.
   * Preserve keyboard navigation.
   * Ensure active state is understandable without relying only on color.

7. **Touch targets**

   * Mobile navigation icons should have comfortable touch targets, ideally around `40–44px`.
   * Do not make icons tiny just to fit more items.

8. **Visual consistency**

   * Reuse the existing Groundwork typography, spacing, colors, borders, shadows, icon library, and design tokens.
   * Do not introduce a new visual style.
   * The navbar should look like a responsive version of the existing sidebar.

9. **Sticky behavior**

   * If the existing sidebar/navbar has persistent navigation behavior, make the mobile top navbar sticky/fixed appropriately.
   * Ensure article content is not hidden underneath it.

10. **Do not add unnecessary features.**

    * No hamburger menu unless the existing navigation contains more items than can reasonably be represented in the horizontal rail.
    * No redesign of the search UI.
    * No changes to unrelated components.

## Breakpoint principle

Use the project's existing breakpoint system if available. Conceptually:

```text
lg+       → full sidebar: icon + label
md        → compact sidebar: icon only
< md      → top navbar: logo + icons + search
```

If the project uses Tailwind, follow the existing Tailwind breakpoint conventions rather than introducing custom breakpoints unnecessarily.

## Final validation

After implementing:

* Test desktop width.
* Test medium/tablet width.
* Test narrow mobile width.
* Test very narrow mobile width.
* Verify no horizontal page overflow.
* Verify logo, navigation icons, and search remain on the same navbar row.
* Verify horizontal navigation scrolling works when needed.
* Verify every navigation item still routes correctly.
* Verify active states work.
* Verify article content does not shift or become unnecessarily narrow.
* Verify the existing sidebar behavior on large screens remains intact.

Before finishing, clean up any duplicated responsive code and keep the implementation maintainable.