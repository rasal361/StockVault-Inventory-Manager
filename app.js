// ============================
//  STOCKVAULT — INVENTORY APP
// ============================

// --- STATE ---
let inventory = JSON.parse(localStorage.getItem('sv_inventory') || '[]');
let currentPage = 'dashboard';
let editingId = null;

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  renderAll();
  setupListeners();
  navigateTo('dashboard');
});

// --- NAVIGATION ---
function navigateTo(page) {
  currentPage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  const titles = { dashboard: 'Dashboard', inventory: 'Inventory', add: editingId ? 'Edit Item' : 'Add Item' };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  if (page === 'inventory') renderInventoryTable();
  if (page === 'dashboard') renderDashboard();
  if (page === 'add' && !editingId) resetForm();
}

window.navigateTo = navigateTo;

// --- LISTENERS ---
function setupListeners() {
  // Nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      editingId = null;
      navigateTo(item.dataset.page);
    });
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Global search
  document.getElementById('globalSearch').addEventListener('input', e => {
    if (currentPage === 'inventory') renderInventoryTable(e.target.value);
    if (currentPage === 'dashboard') renderDashboard(e.target.value);
  });

  // Filters
  document.getElementById('filterCategory').addEventListener('change', () => renderInventoryTable());
  document.getElementById('filterStatus').addEventListener('change', () => renderInventoryTable());
  document.getElementById('sortBy').addEventListener('change', () => renderInventoryTable());

  // Modal overlay click
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
}

// --- THEME ---
function loadTheme() {
  const theme = localStorage.getItem('sv_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
}

function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  document.documentElement.setAttribute('data-theme', isLight ? '' : 'light');
  localStorage.setItem('sv_theme', isLight ? 'dark' : 'light');
}

// --- SAVE ---
function save() {
  localStorage.setItem('sv_inventory', JSON.stringify(inventory));
}

// --- RENDER ALL ---
function renderAll() {
  renderDashboard();
  renderInventoryTable();
  populateCategoryOptions();
}

// --- DASHBOARD ---
function renderDashboard(search = '') {
  const items = search ? inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : inventory;

  // Stats
  const total = inventory.length;
  const lowStock = inventory.filter(i => getStatus(i) === 'low-stock').length;
  const outOfStock = inventory.filter(i => getStatus(i) === 'out-of-stock').length;
  const categories = [...new Set(inventory.map(i => i.category).filter(Boolean))].length;
  const totalValue = inventory.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * (parseInt(i.qty) || 0), 0);

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statLow').textContent = lowStock + outOfStock;
  document.getElementById('statCats').textContent = categories;
  document.getElementById('statValue').textContent = '$' + totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Recent items
  const recentList = document.getElementById('recentList');
  const recent = [...inventory].reverse().slice(0, 6);
  if (recent.length === 0) {
    recentList.innerHTML = '<div class="empty-state">No items yet. Add some!</div>';
  } else {
    recentList.innerHTML = recent.map(item => `
      <div class="list-item">
        <div>
          <div class="list-item-name">${escHtml(item.name)}</div>
          <div class="list-item-meta">${escHtml(item.category || '—')}</div>
        </div>
        <div class="list-item-meta">${item.qty} units</div>
      </div>
    `).join('');
  }

  // Alerts
  const alertList = document.getElementById('alertList');
  const alerts = inventory.filter(i => getStatus(i) === 'low-stock' || getStatus(i) === 'out-of-stock');
  if (alerts.length === 0) {
    alertList.innerHTML = '<div class="empty-state">All stocked up ✓</div>';
  } else {
    alertList.innerHTML = alerts.map(item => `
      <div class="list-item">
        <div>
          <div class="list-item-name">${escHtml(item.name)}</div>
          <div class="list-item-meta">${escHtml(item.category || '—')}</div>
        </div>
        <span class="status-badge status-${getStatus(item)}">${statusLabel(getStatus(item))}</span>
      </div>
    `).join('');
  }
}

// --- INVENTORY TABLE ---
function renderInventoryTable(search = '') {
  const searchVal = search || document.getElementById('globalSearch').value;
  const catFilter = document.getElementById('filterCategory').value;
  const statusFilter = document.getElementById('filterStatus').value;
  const sortBy = document.getElementById('sortBy').value;

  let items = [...inventory];

  // Search
  if (searchVal) {
    const q = searchVal.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.category && i.category.toLowerCase().includes(q)) ||
      (i.sku && i.sku.toLowerCase().includes(q)) ||
      (i.description && i.description.toLowerCase().includes(q))
    );
  }

  // Category filter
  if (catFilter) items = items.filter(i => i.category === catFilter);

  // Status filter
  if (statusFilter) items = items.filter(i => getStatus(i) === statusFilter);

  // Sort
  items.sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name);
      case 'qty-asc': return (parseInt(a.qty) || 0) - (parseInt(b.qty) || 0);
      case 'qty-desc': return (parseInt(b.qty) || 0) - (parseInt(a.qty) || 0);
      case 'price-asc': return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
      case 'price-desc': return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
      default: return 0;
    }
  });

  const tbody = document.getElementById('inventoryBody');
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No items found.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const status = getStatus(item);
    return `
      <tr>
        <td>
          <div class="item-name-cell">${escHtml(item.name)}</div>
          ${item.description ? `<div class="item-desc">${escHtml(item.description.substring(0, 50))}${item.description.length > 50 ? '…' : ''}</div>` : ''}
        </td>
        <td><span class="sku-tag">${escHtml(item.sku || '—')}</span></td>
        <td>${item.category ? `<span class="cat-badge">${escHtml(item.category)}</span>` : '—'}</td>
        <td class="qty-cell">${item.qty}</td>
        <td class="price-cell">$${parseFloat(item.price || 0).toFixed(2)}</td>
        <td><span class="status-badge status-${status}">${statusLabel(status)}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" onclick="viewItem('${item.id}')">View</button>
            <button class="btn-edit" onclick="editItem('${item.id}')">Edit</button>
            <button class="btn-delete" onclick="deleteItem('${item.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  populateCategoryOptions();
}

// --- STATUS ---
function getStatus(item) {
  const qty = parseInt(item.qty) || 0;
  const threshold = parseInt(item.threshold) || 5;
  if (qty === 0) return 'out-of-stock';
  if (qty <= threshold) return 'low-stock';
  return 'in-stock';
}

function statusLabel(status) {
  return { 'in-stock': 'In Stock', 'low-stock': 'Low Stock', 'out-of-stock': 'Out of Stock' }[status] || status;
}

// --- CATEGORY OPTIONS ---
function populateCategoryOptions() {
  const cats = [...new Set(inventory.map(i => i.category).filter(Boolean))].sort();

  // Filter dropdown
  const filterCat = document.getElementById('filterCategory');
  const curr = filterCat.value;
  filterCat.innerHTML = '<option value="">All Categories</option>' +
    cats.map(c => `<option value="${escHtml(c)}" ${c === curr ? 'selected' : ''}>${escHtml(c)}</option>`).join('');

  // Form datalist
  const dl = document.getElementById('categoryList');
  if (dl) dl.innerHTML = cats.map(c => `<option value="${escHtml(c)}">`).join('');
}

// --- FORM ---
function resetForm() {
  editingId = null;
  document.getElementById('editId').value = '';
  document.getElementById('fName').value = '';
  document.getElementById('fSku').value = '';
  document.getElementById('fCategory').value = '';
  document.getElementById('fQty').value = '';
  document.getElementById('fPrice').value = '';
  document.getElementById('fThreshold').value = '';
  document.getElementById('fDesc').value = '';
  document.getElementById('formTitle').textContent = 'Add New Item';
  document.querySelector('.form-sub').textContent = 'Fill in the details below to add an item to your inventory.';
  document.getElementById('submitBtn').textContent = 'Add Item';
}

function submitForm() {
  const name = document.getElementById('fName').value.trim();
  const category = document.getElementById('fCategory').value.trim();
  const qty = document.getElementById('fQty').value;
  const price = document.getElementById('fPrice').value;

  if (!name || !category || qty === '' || price === '') {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  const item = {
    id: editingId || generateId(),
    name,
    sku: document.getElementById('fSku').value.trim(),
    category,
    qty: parseInt(qty) || 0,
    price: parseFloat(price) || 0,
    threshold: parseInt(document.getElementById('fThreshold').value) || 5,
    description: document.getElementById('fDesc').value.trim(),
    updatedAt: new Date().toISOString(),
    createdAt: editingId ? (inventory.find(i => i.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
  };

  if (editingId) {
    const idx = inventory.findIndex(i => i.id === editingId);
    if (idx !== -1) inventory[idx] = item;
    showToast('Item updated successfully.', 'success');
  } else {
    inventory.push(item);
    showToast('Item added to inventory.', 'success');
  }

  save();
  editingId = null;
  renderAll();
  navigateTo('inventory');
}

window.submitForm = submitForm;

function cancelForm() {
  editingId = null;
  navigateTo(inventory.length ? 'inventory' : 'dashboard');
}

window.cancelForm = cancelForm;

// --- EDIT ---
function editItem(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;

  editingId = id;
  document.getElementById('editId').value = id;
  document.getElementById('fName').value = item.name;
  document.getElementById('fSku').value = item.sku || '';
  document.getElementById('fCategory').value = item.category || '';
  document.getElementById('fQty').value = item.qty;
  document.getElementById('fPrice').value = item.price;
  document.getElementById('fThreshold').value = item.threshold || 5;
  document.getElementById('fDesc').value = item.description || '';
  document.getElementById('formTitle').textContent = 'Edit Item';
  document.querySelector('.form-sub').textContent = 'Update the details below and save changes.';
  document.getElementById('submitBtn').textContent = 'Save Changes';
  document.getElementById('pageTitle').textContent = 'Edit Item';

  navigateTo('add');
}

window.editItem = editItem;

// --- VIEW ---
function viewItem(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;

  const status = getStatus(item);
  document.getElementById('modalTitle').textContent = item.name;

  const rows = [
    ['SKU', item.sku || '—'],
    ['Category', item.category || '—'],
    ['Quantity', item.qty + ' units'],
    ['Unit Price', '$' + parseFloat(item.price).toFixed(2)],
    ['Total Value', '$' + (parseFloat(item.price) * parseInt(item.qty)).toFixed(2)],
    ['Low Stock Threshold', item.threshold + ' units'],
    ['Status', `<span class="status-badge status-${status}">${statusLabel(status)}</span>`],
    ['Description', item.description || '—'],
    ['Added', formatDate(item.createdAt)],
    ['Updated', formatDate(item.updatedAt)],
  ];

  document.getElementById('modalBody').innerHTML = rows.map(([k, v]) => `
    <div class="modal-detail-row">
      <span class="modal-key">${k}</span>
      <span class="modal-val">${v}</span>
    </div>
  `).join('');

  document.getElementById('modalOverlay').classList.add('open');
}

window.viewItem = viewItem;

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

window.closeModal = closeModal;

// --- DELETE ---
function deleteItem(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;

  if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

  inventory = inventory.filter(i => i.id !== id);
  save();
  renderAll();
  showToast('Item deleted.', 'info');
}

window.deleteItem = deleteItem;

// --- TOAST ---
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- UTILS ---
function generateId() {
  return 'sv_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function escHtml(str) {
  if (!str) return '';
  return str.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// --- SEED DATA (first run) ---
if (inventory.length === 0) {
  const seed = [
    { name: 'Wireless Keyboard', sku: 'WK-001', category: 'Electronics', qty: 24, price: 49.99, threshold: 5, description: 'Compact wireless keyboard with USB receiver' },
    { name: 'USB-C Hub', sku: 'UC-010', category: 'Electronics', qty: 3, price: 34.99, threshold: 5, description: '7-in-1 USB-C hub' },
    { name: 'Desk Chair', sku: 'DC-203', category: 'Furniture', qty: 8, price: 199.00, threshold: 3, description: 'Ergonomic adjustable desk chair' },
    { name: 'A4 Paper (500 sheets)', sku: 'PP-001', category: 'Stationery', qty: 0, price: 6.50, threshold: 10, description: 'Premium white A4 copy paper' },
    { name: 'Whiteboard Markers', sku: 'WM-004', category: 'Stationery', qty: 40, price: 8.99, threshold: 10, description: 'Assorted colors, pack of 8' },
    { name: 'Standing Desk', sku: 'SD-101', category: 'Furniture', qty: 2, price: 449.00, threshold: 3, description: 'Electric height-adjustable desk' },
  ];
  inventory = seed.map(item => ({
    ...item,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  save();
  renderAll();
}