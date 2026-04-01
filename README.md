# ◈ StockVault — Inventory Manager

A clean, fully client-side inventory management web app built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools, no backend required.

---

## Getting Started

1. Download the three files and place them in the **same folder**:
   ```
   inventory/
   ├── index.html
   ├── style.css
   └── app.js
   ```
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
3. That's it — no installation, no server needed.

---

## Features

### Dashboard
- Live stats — total items, low stock count, unique categories, and total inventory value
- Recent items list showing the latest additions
- Low stock & out-of-stock alerts panel

### Inventory Table
- Full item listing with SKU, category, quantity, price, and status
- Filter by category or stock status
- Sort by name, quantity, or price (ascending / descending)
- Global search across name, SKU, category, and description

### Item Management
- **Add** new items with name, SKU, category, quantity, price, threshold, and description
- **Edit** any existing item inline
- **View** full item details in a modal
- **Delete** items with a confirmation prompt

### Stock Status
Status is calculated automatically based on quantity vs. the low stock threshold:

| Status | Condition |
|---|---|
| ✅ In Stock | Qty > threshold |
| ⚠️ Low Stock | 0 < Qty ≤ threshold |
| ❌ Out of Stock | Qty = 0 |

### UI
- Dark and light theme toggle
- Responsive layout (works on desktop and tablet)
- Toast notifications for all actions
- Seed data pre-loaded on first launch

---

## File Structure

| File | Purpose |
|---|---|
| `index.html` | Page structure, layout, and all UI markup |
| `style.css` | All styling — layout, components, themes, animations |
| `app.js` | All logic — CRUD operations, filtering, sorting, localStorage |

---

## Data Storage

All inventory data is stored in the browser's `localStorage` under the key `sv_inventory`. No data is sent to any server.

To reset the inventory, open your browser's DevTools → Application → Local Storage → delete `sv_inventory`, then refresh.

---

## Browser Support

Works in all modern browsers. Requires JavaScript to be enabled.

| Browser | Supported |
|---|---|
| Chrome 90+ | ✅ |
| Firefox 88+ | ✅ |
| Edge 90+ | ✅ |
| Safari 14+ | ✅ |

---

## Customization

**Change the low stock threshold default** — edit the fallback value in `app.js`:
```js
const threshold = parseInt(item.threshold) || 5; // change 5 to your default
```

**Add more sort options** — extend the `sortBy` select in `index.html` and the switch block in `renderInventoryTable()` in `app.js`.

**Change the color scheme** — all colors are CSS variables at the top of `style.css` under `:root` (dark) and `[data-theme="light"]` (light).

---

## License

Free to use and modify for personal and commercial projects.
