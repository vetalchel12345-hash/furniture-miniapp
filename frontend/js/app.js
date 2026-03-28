let PRODUCTS = [];
let CURRENT_PRODUCT = null;
let CURRENT_PRODUCT_SHORT = null;
let CURRENT_PHOTO_INDEX = 0;

let PRODUCT_LIGHTBOX_STATE = {
  scale: 1,
  x: 0,
  y: 0,
  dragging: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  lastTap: 0
};


const FABRIC_CATEGORY_NAMES = {
  1: 'Velutto',
  2: 'Evita',
  3: 'Kiton',
  4: 'Diagonal',
  5: 'Marbel',
  6: 'Premier',
  7: 'Piano',
  8: 'Belgium',
  9: 'Pandora',
  10: 'Limber',
  11: 'Sunrise',
  12: 'Phlox'
};

let PRODUCT_STATE = {
  selectedCategory: 1,
  selectedFabricFile: null,
  selectedFabricLabel: null,
  selectedBedSize: null,
  selectedBedOrtho: false,
  selectedBedBox: false
};

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}



function getProductStateStorageKey() {
  return CURRENT_PRODUCT_SHORT ? `product_state_${CURRENT_PRODUCT_SHORT.slug}` : null;
}

function saveCurrentProductState() {
  const key = getProductStateStorageKey();
  if (!key) return;
  const payload = {
    selectedCategory: PRODUCT_STATE.selectedCategory,
    selectedFabricFile: PRODUCT_STATE.selectedFabricFile,
    selectedFabricLabel: PRODUCT_STATE.selectedFabricLabel,
    selectedBedSize: PRODUCT_STATE.selectedBedSize,
    selectedBedOrtho: PRODUCT_STATE.selectedBedOrtho,
    selectedBedBox: PRODUCT_STATE.selectedBedBox
  };
  localStorage.setItem(key, JSON.stringify(payload));
}

function restoreCurrentProductState() {
  const key = getProductStateStorageKey();
  if (!key) return false;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const payload = JSON.parse(raw);

    PRODUCT_STATE.selectedCategory = payload.selectedCategory ?? PRODUCT_STATE.selectedCategory;
    PRODUCT_STATE.selectedFabricFile = payload.selectedFabricFile ?? PRODUCT_STATE.selectedFabricFile;
    PRODUCT_STATE.selectedFabricLabel = payload.selectedFabricLabel ?? PRODUCT_STATE.selectedFabricLabel;
    PRODUCT_STATE.selectedBedSize = payload.selectedBedSize ?? PRODUCT_STATE.selectedBedSize;
    PRODUCT_STATE.selectedBedOrtho = payload.selectedBedOrtho ?? PRODUCT_STATE.selectedBedOrtho;
    PRODUCT_STATE.selectedBedBox = payload.selectedBedBox ?? PRODUCT_STATE.selectedBedBox;
    return true;
  } catch (e) {
    return false;
  }
}

function getCurrentConfigurationSummary() {
  const parts = [];
  if (CURRENT_PRODUCT_SHORT?.category === 'krovati') {
    if (PRODUCT_STATE.selectedBedSize) parts.push(`Размер: ${formatBedSize(PRODUCT_STATE.selectedBedSize)}`);
    parts.push(PRODUCT_STATE.selectedBedOrtho ? 'Основание: ортопедическое' : 'Основание: без ортопедического');
    parts.push(PRODUCT_STATE.selectedBedBox ? 'Бельевой короб: есть' : 'Бельевой короб: нет');
  }
  parts.push(`Категория ткани: ${PRODUCT_STATE.selectedCategory}`);
  if (PRODUCT_STATE.selectedFabricLabel) parts.push(`Ткань: ${PRODUCT_STATE.selectedFabricLabel}`);
  return parts;
}

function getCurrentProductUrl() {
  if (!CURRENT_PRODUCT_SHORT) return window.location.href;
  return `${window.location.origin}${window.location.pathname}?id=${CURRENT_PRODUCT_SHORT.id}`;
}

async function shareCurrentProduct() {
  if (!CURRENT_PRODUCT_SHORT) return;
  const text = `${CURRENT_PRODUCT.name}\n${getCurrentConfigurationSummary().join('\n')}\nЦена: ${formatPrice(getCurrentProductFinalPrice())}\n${getCurrentProductUrl()}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: CURRENT_PRODUCT.name,
        text,
        url: getCurrentProductUrl()
      });
      return;
    } catch (e) {}
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast('Ссылка и конфигурация скопированы');
  } catch (e) {
    showToast('Не удалось поделиться');
  }
}

function renderRelatedProducts() {
  if (!CURRENT_PRODUCT_SHORT) return '';
  const related = PRODUCTS
    .filter(x => x.category === CURRENT_PRODUCT_SHORT.category && x.slug !== CURRENT_PRODUCT_SHORT.slug)
    .slice(0, 4);

  if (!related.length) return '';

  return `
    <section class="product-card-block glass glass-strong">
      <div class="home-section-head" style="margin-bottom:14px;">
        <div>
          <div class="eyebrow">Похожие товары</div>
          <h2 class="home-section-title" style="font-size:26px;">Похожие модели</h2>
        </div>
      </div>

      <div class="home-products-row">
        ${related.map(item => {
          const qty = getCatalogCartQty(item);
          const actionHtml = qty > 0
            ? `
              <div class="catalog-qty-box">
                <button class="catalog-qty-btn" onclick="decreaseCatalogQty(${item.id})">−</button>
                <div class="catalog-qty-value">${qty}</div>
                <button class="catalog-qty-btn" onclick="increaseCatalogQty(${item.id})">+</button>
              </div>
            `
            : `
              <button class="primary-btn" onclick="addSimpleToCart(${item.id})">🛒 В корзину</button>
            `;

          return `
            <article class="product-catalog-card glass glass-strong">
              <a href="./product.html?id=${item.id}" class="product-catalog-link">
                <div class="product-catalog-image-wrap">
                  <img src="${item.photos?.[0] || ''}" alt="${item.name}" class="product-catalog-image">
                </div>
              </a>
              <div class="product-catalog-body">
                <div class="product-catalog-badge">${item.badge || 'Модель'}</div>
                <a href="./product.html?id=${item.id}" class="product-catalog-title">${getDisplayProductName(item)}</a>
                <div class="product-catalog-specs">${item.short_specs || ''}</div>
                <div class="product-catalog-price-row">
                  <div class="product-catalog-price">${formatPrice(item.price)}</div>
                  <div class="product-catalog-old-price">${formatPrice(item.old_price || Math.round(item.price * 1.3))}</div>
                </div>
                <div class="product-catalog-actions">
                  ${actionHtml}
                  <a href="./product.html?id=${item.id}" class="ghost-btn product-open-btn">Открыть</a>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </section>
  `;
}


function getDisplayProductName(product) {
  const name = String(product.name || '');

  return name
    .replace(/^Диван двухместный\s+/i, '')
    .replace(/^Диван тр[её]хместный\s+/i, '')
    .replace(/^Угловой диван\s+/i, '')
    .replace(/^Кресло\s+/i, '')
    .replace(/^Кровать\s+/i, '')
    .replace(/^Пуф\s+/i, '')
    .trim();
}

function formatPrice(value) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Number(value || 0))) + ' ₽';
}

function showToast(message) {
  const el = document.getElementById('app-toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

async function loadProducts() {
  const res = await fetch('./data/products.json?v=' + Date.now());
  PRODUCTS = await res.json();
}

function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function setCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function setFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavoritesBadge();
}

function isFavorite(slug) {
  return getFavorites().includes(slug);
}

function toggleFavoriteBySlug(slug) {
  const favorites = getFavorites();
  const i = favorites.indexOf(slug);
  if (i >= 0) favorites.splice(i, 1);
  else favorites.push(slug);
  setFavorites(favorites);

  if (document.getElementById('product-page-root')) renderProductPage();
  if (document.getElementById('catalog-list')) renderCatalogPage();
  if (document.getElementById('favorites-list')) renderFavoritesPage();
  renderHomePage();
  if (document.getElementById('category-page-title')) renderCategoryPage();
  if (document.getElementById('product-list-title')) renderProductListPage();
}


function updateFavoritesBadge() {
  document.querySelectorAll('.nav-favorites-link').forEach(link => {
    let badge = link.querySelector('.nav-favorites-badge');
    const count = getFavorites().length;

    if (!count) {
      if (badge) badge.remove();
      return;
    }

    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-favorites-badge';
      link.appendChild(badge);
    }
    badge.textContent = count > 99 ? '99+' : String(count);
  });
}


function updateCartBadge() {
  document.querySelectorAll('.nav-cart-link').forEach(link => {
    let badge = link.querySelector('.nav-cart-badge');
    const count = getCart().reduce((sum, item) => sum + Number(item.qty || 1), 0);

    if (!count) {
      if (badge) badge.remove();
      return;
    }

    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-cart-badge';
      link.appendChild(badge);
    }
    badge.textContent = count > 99 ? '99+' : String(count);
  });
}

function goBackSmart() {
  if (document.referrer && document.referrer.includes(window.location.host)) history.back();
  else location.href = './catalog.html';
}

function getCatalogCartQty(product) {
  const cart = getCart();
  return cart
    .filter(x => x.slug === product.slug)
    .reduce((sum, item) => sum + Number(item.qty || 1), 0);
}

function addSimpleToCart(productId) {
  const product = PRODUCTS.find(p => String(p.id) === String(productId));
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(x => x.slug === product.slug && x.selected_fabric_category === 1 && !x.selected_fabric_name);

  if (existing) existing.qty += 1;
  else {
    cart.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      base_price: product.price,
      selected_fabric_category: 1,
      selected_fabric_category_name: FABRIC_CATEGORY_NAMES[1],
      selected_fabric_name: null,
      selected_fabric_file: null,
      selected_fabric_path: null,
      final_price: product.price,
      qty: 1,
      selected: true,
      photo: product.photos?.[0] || null
    });
  }

  saveCurrentProductState();
  setCart(cart);
  showToast('Товар добавлен в корзину');
  if (document.getElementById('catalog-list')) renderCatalogPage();
  if (document.getElementById('favorites-list')) renderFavoritesPage();
  renderHomePage();
  if (document.getElementById('category-page-title')) renderCategoryPage();
  if (document.getElementById('product-list-title')) renderProductListPage();
}

function increaseCatalogQty(productId) {
  addSimpleToCart(productId);
}

function decreaseCatalogQty(productId) {
  const product = PRODUCTS.find(p => String(p.id) === String(productId));
  if (!product) return;

  const cart = getCart();
  const idx = cart.findIndex(x => x.slug === product.slug);

  if (idx === -1) return;

  cart[idx].qty = Number(cart[idx].qty || 1) - 1;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);

  setCart(cart);
  if (document.getElementById('catalog-list')) renderCatalogPage();
  if (document.getElementById('favorites-list')) renderFavoritesPage();
  renderHomePage();
  if (document.getElementById('category-page-title')) renderCategoryPage();
  if (document.getElementById('product-list-title')) renderProductListPage();
}

function increaseCartItem(index) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].qty = Number(cart[index].qty || 1) + 1;
  setCart(cart);
  renderCartPage();
}

function decreaseCartItem(index) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].qty = Number(cart[index].qty || 1) - 1;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  setCart(cart);
  renderCartPage();
}

function removeCartItem(index) {
  const cart = getCart();
  if (!cart[index]) return;
  cart.splice(index, 1);
  setCart(cart);
  renderCartPage();
}

function toggleCartItemSelected(index) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].selected = !Boolean(cart[index].selected);
  setCart(cart);
  renderCartPage();
}

function selectAllCartItems() {
  const cart = getCart().map(item => ({ ...item, selected: true }));
  setCart(cart);
  renderCartPage();
}

function unselectAllCartItems() {
  const cart = getCart().map(item => ({ ...item, selected: false }));
  setCart(cart);
  renderCartPage();
}

function removeSelectedCartItems() {
  const cart = getCart().filter(item => item.selected === false);
  setCart(cart);
  renderCartPage();
  showToast('Выбранные товары удалены');
}

function getSelectedCartItems() {
  return getCart().filter(item => item.selected !== false);
}


function renderFavoritesPage() {
  const list = document.getElementById('favorites-list');
  if (!list) return;

  const favorites = getFavorites();
  const items = PRODUCTS.filter(item => favorites.includes(item.slug));

  if (!items.length) {
    list.innerHTML = `
      <section class="cart-empty glass glass-strong">
        <h3>Избранное пока пустое</h3>
        <p>Нажимайте на сердечки в каталоге и карточках товаров.</p>
      </section>
    `;
    return;
  }

  list.innerHTML = items.map(item => {
    const qty = getCatalogCartQty(item);

    const actionHtml = qty > 0
      ? `
        <div class="catalog-qty-box">
          <button class="catalog-qty-btn" onclick="decreaseCatalogQty(${item.id})">−</button>
          <div class="catalog-qty-value">${qty}</div>
          <button class="catalog-qty-btn" onclick="increaseCatalogQty(${item.id})">+</button>
        </div>
      `
      : `
        <button class="primary-btn" onclick="addSimpleToCart(${item.id})">🛒 В корзину</button>
      `;

    return `
      <article class="product-catalog-card glass glass-strong">
        <a href="./product.html?id=${item.id}" class="product-catalog-link">
          <div class="product-catalog-image-wrap">
            <img src="${item.photos?.[0] || ''}" alt="${item.name}" class="product-catalog-image">
            <button class="catalog-fav-btn" onclick="event.preventDefault();event.stopPropagation();toggleFavoriteBySlug('${item.slug}')">
              ♥
            </button>
          </div>
        </a>
        <div class="product-catalog-body">
          <div class="product-catalog-badge">${item.badge || 'Модель'}</div>
          <a href="./product.html?id=${item.id}" class="product-catalog-title">${getDisplayProductName(item)}</a>
          <div class="product-catalog-specs">${item.short_specs || ''}</div>
          <div class="product-catalog-price-row">
            <div class="product-catalog-price">${formatPrice(item.price)}</div>
            <div class="product-catalog-old-price">${formatPrice(item.old_price || Math.round(item.price * 1.3))}</div>
          </div>
          <div class="product-catalog-actions">
            ${actionHtml}
            <a href="./product.html?id=${item.id}" class="ghost-btn product-open-btn">Открыть</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}


function renderCatalogPage() {
  const list = document.getElementById('catalog-list');
  if (!list) return;

  const category = getQueryParam('category');
  const search = (getQueryParam('search') || '').trim().toLowerCase();

  let items = [...PRODUCTS];
  if (category) items = items.filter(item => item.category === category);
  if (search) {
    items = items.filter(item =>
      item.name.toLowerCase().includes(search) ||
      (item.description || '').toLowerCase().includes(search)
    );
  }

  if (!items.length) {
    list.innerHTML = `<div class="empty"><h3>Товаров пока нет</h3><p>Для этой группы товары ещё не добавлены</p></div>`;
    return;
  }

  list.innerHTML = items.map(item => {
    const qty = getCatalogCartQty(item);

    const actionHtml = qty > 0
      ? `
        <div class="catalog-qty-box">
          <button class="catalog-qty-btn" onclick="decreaseCatalogQty(${item.id})">−</button>
          <div class="catalog-qty-value">${qty}</div>
          <button class="catalog-qty-btn" onclick="increaseCatalogQty(${item.id})">+</button>
        </div>
      `
      : `
        <button class="primary-btn" onclick="addSimpleToCart(${item.id})">🛒 В корзину</button>
      `;

    return `
      <article class="product-catalog-card glass glass-strong">
        <a href="./product.html?id=${item.id}" class="product-catalog-link">
          <div class="product-catalog-image-wrap">
            <img src="${item.photos?.[0] || ''}" alt="${item.name}" class="product-catalog-image">
            <button class="catalog-fav-btn" onclick="event.preventDefault();event.stopPropagation();toggleFavoriteBySlug('${item.slug}')">
              ${isFavorite(item.slug) ? '♥' : '♡'}
            </button>
          </div>
        </a>
        <div class="product-catalog-body">
          <div class="product-catalog-badge">${item.badge || 'Модель'}</div>
          <a href="./product.html?id=${item.id}" class="product-catalog-title">${getDisplayProductName(item)}</a>
          <div class="product-catalog-specs">${item.short_specs || ''}</div>
          <div class="product-catalog-price-row">
            <div class="product-catalog-price">${formatPrice(item.price)}</div>
            <div class="product-catalog-old-price">${formatPrice(item.old_price || Math.round(item.price * 1.3))}</div>
          </div>
          <div class="product-catalog-actions">
            ${actionHtml}
            <a href="./product.html?id=${item.id}" class="ghost-btn product-open-btn">Открыть</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderCartPage() {
  const list = document.getElementById('cart-list');
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');
  const goCheckoutBtn = document.getElementById('go-checkout-button');
  if (!list) return;

  const cart = getCart();

  if (!cart.length) {
    list.innerHTML = `
      <section class="cart-empty glass glass-strong">
        <h3>Корзина пока пустая</h3>
        <p>Добавьте товары из каталога, и они появятся здесь.</p>
      </section>
    `;
    if (countEl) countEl.textContent = '0 товаров';
    if (totalEl) totalEl.textContent = '0 ₽';
  } else {
    list.innerHTML = cart.map((item, index) => `
      <article class="cart-item-card glass glass-strong">
        <div class="cart-item-photo-wrap">
          <img class="cart-item-photo" src="${item.photo || './assets/placeholders/coming-soon.jpg'}" alt="${item.name}">
        </div>

        <div class="cart-item-body">
          <div class="cart-item-title-row">
            <div class="cart-item-title-left">
              <label class="cart-check-chip">
                <input class="cart-item-check" type="checkbox" ${item.selected !== false ? 'checked' : ''} onchange="toggleCartItemSelected(${index})">
                <span></span>
              </label>
              <div class="cart-item-title-wrap">
                <h3 class="cart-item-title">${getDisplayProductName(item)}</h3>
                <div class="cart-item-meta">
                  ${item.selected_fabric_category_name ? `Ткань: ${item.selected_fabric_category_name}` : ''}
                  ${item.selected_fabric_name ? ` • ${item.selected_fabric_name}` : ''}
                </div>
              </div>
            </div>

            <button class="cart-remove-chip" onclick="removeCartItem(${index})">Удалить</button>
          </div>

          <div class="cart-item-price">${formatPrice((item.final_price || 0) * (item.qty || 1))}</div>

          <div class="cart-item-controls">
            <div class="qty-box">
              <button class="qty-btn" onclick="decreaseCartItem(${index})">−</button>
              <div class="qty-value">${item.qty || 1}</div>
              <button class="qty-btn" onclick="increaseCartItem(${index})">+</button>
            </div>
          </div>
        </div>
      </article>
    `).join('');

    const selectedItems = getSelectedCartItems();
    const totalCount = selectedItems.reduce((sum, item) => sum + Number(item.qty || 1), 0);
    const totalPrice = selectedItems.reduce((sum, item) => sum + Number(item.final_price || 0) * Number(item.qty || 1), 0);

    if (countEl) countEl.textContent = `${totalCount} товар${totalCount === 1 ? '' : totalCount < 5 ? 'а' : 'ов'}`;
    if (totalEl) totalEl.textContent = formatPrice(totalPrice);
  }

  if (goCheckoutBtn) {
    goCheckoutBtn.onclick = () => {
      const selected = getSelectedCartItems();
      if (!selected.length) {
        showToast('Выберите товары для оформления');
        return;
      }
      location.href = './checkout.html';
    };
  }
}

function renderCheckoutPage() {
  const preview = document.getElementById('checkout-preview');
  const countEl = document.getElementById('checkout-count');
  const totalEl = document.getElementById('checkout-total');
  const checkoutBtn = document.getElementById('checkout-button');
  if (!checkoutBtn) return;

  const cart = getSelectedCartItems();
  const totalCount = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const totalPrice = cart.reduce((sum, item) => sum + Number(item.final_price || 0) * Number(item.qty || 1), 0);

  if (preview) {
    preview.innerHTML = cart.map(item => `
      <article class="cart-item-card glass glass-strong">
        <img class="cart-item-photo" src="${item.photo || './assets/placeholders/coming-soon.jpg'}" alt="${item.name}">
        <div class="cart-item-body">
          <h3 class="cart-item-title">${getDisplayProductName(item)}</h3>
          <div class="cart-item-meta">
            ${item.selected_fabric_category_name ? `Ткань: ${item.selected_fabric_category_name}` : ''}
            ${item.selected_fabric_name ? ` • ${item.selected_fabric_name}` : ''}
          </div>
          <div class="cart-item-price">${formatPrice((item.final_price || 0) * (item.qty || 1))}</div>
        </div>
      </article>
    `).join('');
  }

  if (countEl) countEl.textContent = String(totalCount);
  if (totalEl) totalEl.textContent = formatPrice(totalPrice);

  checkoutBtn.onclick = async () => {
    if (!cart.length) {
      showToast('Нет выбранных товаров');
      return;
    }

    const payload = {
      customer_name: document.getElementById('cart-name')?.value?.trim() || '',
      customer_phone: document.getElementById('cart-phone')?.value?.trim() || '',
      city: document.getElementById('cart-city')?.value?.trim() || '',
      contact_method: document.getElementById('cart-contact-method')?.value?.trim() || '',
      comment: document.getElementById('cart-comment')?.value?.trim() || '',
      delivery_type: document.getElementById('cart-delivery-type')?.value || '',
      address: document.getElementById('cart-address')?.value?.trim() || '',
      floor: document.getElementById('cart-floor')?.value?.trim() || '',
      lift: document.getElementById('cart-lift')?.value?.trim() || '',
      items: cart,
      total_price: totalPrice
    };

    if (!payload.customer_name || !payload.customer_phone) {
      showToast('Заполните имя и телефон');
      return;
    }

    try {
      const result = await apiCreateOrder(payload);
      showToast(`Заказ отправлен № ${result.order_id || ''}`);

      const fullCart = getCart().filter(item => item.selected === false);
      setCart(fullCart);
      setTimeout(() => location.href = './cart.html', 700);
    } catch (e) {
      console.error(e);
      showToast('Не удалось отправить заказ');
    }
  };
}

async function loadCurrentProduct() {
  const productId = getQueryParam('id') || '101';
  CURRENT_PRODUCT_SHORT = PRODUCTS.find(p => String(p.id) === String(productId)) || null;
  if (!CURRENT_PRODUCT_SHORT) return;

  const res = await fetch(`./assets/products/${CURRENT_PRODUCT_SHORT.slug}/product.json?v=` + Date.now());
  CURRENT_PRODUCT = await res.json();

  if (isBedProduct(CURRENT_PRODUCT_SHORT)) {
    PRODUCT_STATE.selectedBedSize = CURRENT_PRODUCT.default_configuration?.size || '160x200';
    PRODUCT_STATE.selectedBedOrtho = !!CURRENT_PRODUCT.default_configuration?.orthopedic_base;
    PRODUCT_STATE.selectedBedBox = !!CURRENT_PRODUCT.default_configuration?.storage_box;
  }

  restoreCurrentProductState();
}


function isBedProduct(product) {
  return product && product.category === 'krovati';
}

function getBedBasePrice() {
  if (!CURRENT_PRODUCT) return 0;
  if (!isBedProduct(CURRENT_PRODUCT_SHORT)) return Number(CURRENT_PRODUCT.price || 0);

  const sizeKey = PRODUCT_STATE.selectedBedSize || CURRENT_PRODUCT.default_configuration?.size || '160x200';
  const sizePrice = Number(CURRENT_PRODUCT.sizes?.[sizeKey] || 0);
  const orthoPrice = PRODUCT_STATE.selectedBedOrtho
    ? Number(CURRENT_PRODUCT.base_options?.with_orthopedic || 0)
    : Number(CURRENT_PRODUCT.base_options?.without_orthopedic || 0);
  const boxPrice = PRODUCT_STATE.selectedBedBox
    ? Number(CURRENT_PRODUCT.storage_options?.with_storage || 0)
    : Number(CURRENT_PRODUCT.storage_options?.without_storage || 0);

  return sizePrice + orthoPrice + boxPrice;
}

function getCurrentProductFinalPrice() {
  if (!CURRENT_PRODUCT) return 0;

  if (isBedProduct(CURRENT_PRODUCT_SHORT)) {
    const base = getBedBasePrice();
    const fabricAddon = Number(CURRENT_PRODUCT.fabric_prices?.[String(PRODUCT_STATE.selectedCategory)] || 0);
    return base + fabricAddon;
  }

  const extra = Number(CURRENT_PRODUCT.fabric_prices?.[String(PRODUCT_STATE.selectedCategory)] || 0);
  return Number(CURRENT_PRODUCT.price || 0) + extra;
}

function formatBedSize(sizeKey) {
  return String(sizeKey || '').replace('x', ' × ') + ' см';
}

function getCurrentPrice() {
  return getCurrentProductFinalPrice();
}

function getOldPrice(currentPrice) {
  return Math.round(Number(currentPrice) * 1.3);
}

function getMonthlyPrice(currentPrice) {
  return Math.round(Number(currentPrice) / 12);
}

function getSelectedFabricPath() {
  if (!PRODUCT_STATE.selectedFabricFile) return null;
  return `./assets/fabrics/category-${PRODUCT_STATE.selectedCategory}/${PRODUCT_STATE.selectedFabricFile}`;
}

function getProductRating() {
  return Number(CURRENT_PRODUCT?.rating || 4.9);
}

function getProductReviewsCount() {
  return Number(CURRENT_PRODUCT?.reviews_count || 12);
}




function resetProductLightboxZoom() {
  PRODUCT_LIGHTBOX_STATE.scale = 1;
  PRODUCT_LIGHTBOX_STATE.x = 0;
  PRODUCT_LIGHTBOX_STATE.y = 0;
  applyProductLightboxTransform();
}

function applyProductLightboxTransform() {
  const img = document.getElementById('product-lightbox-image');
  if (!img) return;

  img.style.transform = `translate(${PRODUCT_LIGHTBOX_STATE.x}px, ${PRODUCT_LIGHTBOX_STATE.y}px) scale(${PRODUCT_LIGHTBOX_STATE.scale})`;
  img.classList.toggle('zoomed', PRODUCT_LIGHTBOX_STATE.scale > 1);
}

function renderProductLightboxThumbs() {
  const root = document.getElementById('product-lightbox-thumbs');
  if (!root || !CURRENT_PRODUCT || !CURRENT_PRODUCT.photos?.length) return;

  root.innerHTML = CURRENT_PRODUCT.photos.map((photo, index) => `
    <button class="product-lightbox-thumb ${index === CURRENT_PHOTO_INDEX ? 'active' : ''}" onclick="goToProductLightboxSlide(${index})">
      <img src="${photo}" alt="Миниатюра ${index + 1}">
    </button>
  `).join('');
}

function goToProductLightboxSlide(index) {
  if (!CURRENT_PRODUCT || !CURRENT_PRODUCT.photos?.length) return;
  CURRENT_PHOTO_INDEX = index;
  resetProductLightboxZoom();
  updateProductLightboxUI();
}


function updateProductLightboxUI() {
  if (!CURRENT_PRODUCT || !CURRENT_PRODUCT.photos?.length) return;
  const img = document.getElementById('product-lightbox-image');
  const counter = document.getElementById('product-lightbox-counter');
  if (img) img.src = CURRENT_PRODUCT.photos[CURRENT_PHOTO_INDEX];
  if (counter) counter.textContent = `${CURRENT_PHOTO_INDEX + 1} / ${CURRENT_PRODUCT.photos.length}`;
  renderProductLightboxThumbs();
  applyProductLightboxTransform();
}


function openProductLightbox(index = 0) {
  if (!CURRENT_PRODUCT || !CURRENT_PRODUCT.photos?.length) return;
  CURRENT_PHOTO_INDEX = index;
  const modal = document.getElementById('product-lightbox');
  if (!modal) return;

  resetProductLightboxZoom();
  resetProductLightboxZoom();
  updateProductLightboxUI();
  bindProductLightboxSwipe();
  bindProductLightboxZoom();
  bindProductLightboxZoom();
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeProductLightbox() {
  const modal = document.getElementById('product-lightbox');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.style.overflow = '';
  resetProductLightboxZoom();
}

function nextProductLightbox() {
  if (!CURRENT_PRODUCT || !CURRENT_PRODUCT.photos?.length) return;
  CURRENT_PHOTO_INDEX = (CURRENT_PHOTO_INDEX + 1) % CURRENT_PRODUCT.photos.length;
  resetProductLightboxZoom();
  updateProductLightboxUI();
}

function prevProductLightbox() {
  if (!CURRENT_PRODUCT || !CURRENT_PRODUCT.photos?.length) return;
  CURRENT_PHOTO_INDEX = (CURRENT_PHOTO_INDEX - 1 + CURRENT_PRODUCT.photos.length) % CURRENT_PRODUCT.photos.length;
  resetProductLightboxZoom();
  updateProductLightboxUI();
}


function changeProductPhoto(index) {
  CURRENT_PHOTO_INDEX = index;
  renderProductPage();
}


function selectBedSize(sizeKey) {
  PRODUCT_STATE.selectedBedSize = sizeKey;
  saveCurrentProductState();
  renderProductPage();
}

function selectBedOrtho(value) {
  PRODUCT_STATE.selectedBedOrtho = value === true;
  saveCurrentProductState();
  renderProductPage();
}

function selectBedBox(value) {
  PRODUCT_STATE.selectedBedBox = value === true;
  saveCurrentProductState();
  renderProductPage();
}

function bindStickyButtons() {
  const cartBtn = document.getElementById('sticky-cart-btn');
  const fabricBtn = document.getElementById('sticky-fabric-btn');
  const managerBtn = document.getElementById('sticky-manager-btn');
  const favBtn = document.getElementById('sticky-fav-btn');

  if (cartBtn) cartBtn.onclick = addConfiguredProductToCart;
  if (fabricBtn) fabricBtn.onclick = openFabricCategorySheet;
  if (managerBtn) managerBtn.onclick = () => showToast('Связь с менеджером подключим следующим этапом');
  if (favBtn) {
    favBtn.innerHTML = isFavorite(CURRENT_PRODUCT_SHORT?.slug) ? '♥' : '♡';
    favBtn.onclick = () => toggleFavoriteBySlug(CURRENT_PRODUCT_SHORT.slug);
  }
}



function renderProductPage() {
  const root = document.getElementById('product-page-root');
  if (!root || !CURRENT_PRODUCT) return;

  const isBed = isBedProduct(CURRENT_PRODUCT_SHORT);
  const photos = CURRENT_PRODUCT.photos || [];
  const currentPhoto = photos[CURRENT_PHOTO_INDEX] || photos[0] || '';
  const currentPrice = getCurrentPrice();
  const oldPrice = getOldPrice(currentPrice);
  const monthly = getMonthlyPrice(currentPrice);
  const selectedFabricPath = getSelectedFabricPath();
  const rating = getProductRating();
  const reviewsCount = getProductReviewsCount();
  const fav = isFavorite(CURRENT_PRODUCT_SHORT?.slug);

  const selectedSize = PRODUCT_STATE.selectedBedSize || CURRENT_PRODUCT.default_configuration?.size || '160x200';
  const summaryItems = getCurrentConfigurationSummary();

  const bedOptionsHtml = isBed ? `
    <section class="product-card-block glass glass-strong">
      <div class="product-options-block">
        <h3 class="product-options-title">Размер спального места</h3>
        <div class="product-option-chips">
          ${Object.keys(CURRENT_PRODUCT.sizes || {}).map(sizeKey => `
            <button class="category-chip ${selectedSize === sizeKey ? 'category-chip-active' : ''}" onclick="selectBedSize('${sizeKey}')">
              ${formatBedSize(sizeKey)}
            </button>
          `).join('')}
        </div>

        <h3 class="product-options-title">Основание</h3>
        <div class="product-option-chips">
          <button class="category-chip ${!PRODUCT_STATE.selectedBedOrtho ? 'category-chip-active' : ''}" onclick="selectBedOrtho(false)">
            Без ортопедического основания
          </button>
          <button class="category-chip ${PRODUCT_STATE.selectedBedOrtho ? 'category-chip-active' : ''}" onclick="selectBedOrtho(true)">
            С ортопедическим основанием
          </button>
        </div>

        <h3 class="product-options-title">Бельевой короб</h3>
        <div class="product-option-chips">
          <button class="category-chip ${!PRODUCT_STATE.selectedBedBox ? 'category-chip-active' : ''}" onclick="selectBedBox(false)">
            Без бельевого короба
          </button>
          <button class="category-chip ${PRODUCT_STATE.selectedBedBox ? 'category-chip-active' : ''}" onclick="selectBedBox(true)">
            С бельевым коробом
          </button>
        </div>
      </div>
    </section>
  ` : '';

  root.innerHTML = `
    <section class="product-premium">
      <section class="product-card-block glass glass-strong">
        <div class="product-header-actions">
          <button class="icon-btn back-btn" onclick="goBackSmart()">←</button>
          <div class="product-header-right product-header-right-actions">
            <button class="icon-btn" onclick="shareCurrentProduct()">↗</button>
            <button class="icon-btn" onclick="toggleFavoriteBySlug('${CURRENT_PRODUCT_SHORT.slug}')">${fav ? '♥' : '♡'}</button>
          </div>
        </div>

        <div class="product-gallery-premium">
          <div class="product-main-image-wrap" onclick="openProductLightbox(CURRENT_PHOTO_INDEX)" style="cursor:zoom-in;">
            <img src="${currentPhoto}" alt="${CURRENT_PRODUCT.name}">
          </div>

          <div class="product-thumbs-row">
            ${photos.map((photo, index) => `
              <button class="product-thumb-btn" onclick="changeProductPhoto(${index})">
                <img src="${photo}" alt="Фото ${index + 1}">
              </button>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="product-card-block glass glass-strong">
        <div class="product-top-line">
          <div class="product-rating-line">
            <strong>⭐ ${rating.toFixed(1).replace('.', ',')}</strong>
            <span>${reviewsCount} оценок</span>
          </div>
        </div>

        <h1 class="product-title-main">${CURRENT_PRODUCT.name}</h1>
        <div class="product-subtitle-text">${CURRENT_PRODUCT.description || ''}</div>

        <div class="product-badge-row">
          <span class="product-badge-pill">Собственное производство</span>
          <span class="product-badge-pill">12 категорий ткани</span>
          ${isBed ? '<span class="product-badge-pill">Размеры на выбор</span>' : '<span class="product-badge-pill">Популярная модель</span>'}
        </div>

        <div class="product-price-box">
          <div class="product-price-caption">Цена от</div>
          <div class="product-price-main">${formatPrice(currentPrice)}</div>
          <div class="product-price-old">${formatPrice(oldPrice)}</div>
          <div class="product-installment">Рассрочка от ${formatPrice(monthly)}/мес</div>
        </div>

        <div class="product-quick-specs">
          ${(CURRENT_PRODUCT.specs || []).slice(0, 4).map(([key, value]) => `
            <div class="product-quick-spec">
              <div class="product-quick-spec-icon">•</div>
              <div>
                <div class="product-quick-spec-label">${key}</div>
                <div class="product-quick-spec-value">${value}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      ${bedOptionsHtml}

      <section class="product-card-block glass glass-strong">
        <div class="selected-fabric-card">
          <div class="selected-fabric-title">Выбранная ткань</div>
          <div class="selected-fabric-layout">
            ${selectedFabricPath ? `<img src="${selectedFabricPath}" alt="${PRODUCT_STATE.selectedFabricLabel || ''}" class="selected-fabric-preview" onclick="openProductLightbox(CURRENT_PHOTO_INDEX)">` : `<div class="selected-fabric-placeholder">🧵</div>`}
            <div>
              <div class="selected-fabric-sub">Категория ${PRODUCT_STATE.selectedCategory} — ${FABRIC_CATEGORY_NAMES[PRODUCT_STATE.selectedCategory]}</div>
              <div class="selected-fabric-name">${PRODUCT_STATE.selectedFabricLabel || 'Ткань ещё не выбрана'}</div>
            </div>
          </div>

          <div class="selected-fabric-mini-gallery">
            ${selectedFabricPath ? `
              <button class="selected-fabric-mini active">
                <img src="${selectedFabricPath}" alt="${PRODUCT_STATE.selectedFabricLabel || ''}">
              </button>
            ` : `
              <div class="selected-fabric-mini empty">Нет фото ткани</div>
            `}
          </div>

          <button class="primary-btn" onclick="openFabricCategorySheet()">🧵 Изменить ткань</button>
        </div>
      </section>

      <section class="product-card-block glass glass-strong">
        <div class="home-section-head" style="margin-bottom:14px;">
          <div>
            <div class="eyebrow">Комплектация</div>
            <h2 class="home-section-title" style="font-size:26px;">Что входит в цену</h2>
          </div>
        </div>

        <div class="product-includes-list">
          ${summaryItems.map(item => `<div class="product-include-item">${item}</div>`).join('')}
          <div class="product-include-item strong">Итоговая цена: ${formatPrice(currentPrice)}</div>
        </div>
      </section>

      <section class="product-card-block glass glass-strong">
        <h3 style="margin-top:0;">Характеристики</h3>
        <div class="product-spec-table">
          ${(CURRENT_PRODUCT.specs || []).map(([key, value]) => `
            <div class="product-spec-row">
              <div class="product-spec-key">${key}</div>
              <div class="product-spec-value">${value}</div>
            </div>
          `).join('')}
        </div>
      </section>

      ${renderRelatedProducts()}
    </section>
  `;

  bindStickyButtons();
}

async function openFabricCategorySheet() {
  const backdrop = document.getElementById('fabric-category-sheet');
  const list = document.getElementById('fabric-category-list');
  if (!backdrop || !list || !CURRENT_PRODUCT) return;

  list.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const extra = Number(CURRENT_PRODUCT.fabric_prices?.[String(i)] || 0);
    const finalPrice = Number(CURRENT_PRODUCT.price) + extra;

    const btn = document.createElement('button');
    btn.className = 'fabric-category-btn';
    btn.innerHTML = `
      <div class="fabric-category-title">Категория ${i} — ${FABRIC_CATEGORY_NAMES[i]}</div>
      <div class="fabric-category-sub">${formatPrice(finalPrice)}</div>
    `;
    btn.onclick = () => openFabricColorSheet(i);
    list.appendChild(btn);
  }
  backdrop.style.display = 'block';
}

async function openFabricColorSheet(categoryNumber) {
  PRODUCT_STATE.selectedCategory = categoryNumber;
  saveCurrentProductState();
  renderProductPage();

  const categorySheet = document.getElementById('fabric-category-sheet');
  const colorSheet = document.getElementById('fabric-color-sheet');
  const title = document.getElementById('fabric-color-title');
  const grid = document.getElementById('fabric-color-grid');

  if (!colorSheet || !grid) return;
  if (categorySheet) categorySheet.style.display = 'none';

  title.textContent = `Категория ${categoryNumber} — ${FABRIC_CATEGORY_NAMES[categoryNumber]}`;
  grid.innerHTML = '';

  try {
    const res = await fetch(`./assets/fabrics/category-${categoryNumber}/index.json?v=` + Date.now());
    const files = await res.json();

    files.forEach(file => {
      const card = document.createElement('div');
      card.className = 'fabric-color-card';
      const label = file.replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/[_-]+/g, ' ');

      card.innerHTML = `
        <img src="./assets/fabrics/category-${categoryNumber}/${file}" alt="${label}">
        <div class="fabric-color-meta">${label}</div>
      `;

      card.onclick = () => {
        PRODUCT_STATE.selectedFabricFile = file;
        PRODUCT_STATE.selectedFabricLabel = label;
        saveCurrentProductState();
        closeFabricSheets();
        renderProductPage();
      };

      grid.appendChild(card);
    });

    colorSheet.style.display = 'block';
  } catch (e) {
    console.error(e);
    showToast('Не удалось загрузить ткани');
  }
}

function closeFabricSheets() {
  const a = document.getElementById('fabric-category-sheet');
  const b = document.getElementById('fabric-color-sheet');
  if (a) a.style.display = 'none';
  if (b) b.style.display = 'none';
}

function addConfiguredProductToCart() {
  if (!CURRENT_PRODUCT || !CURRENT_PRODUCT_SHORT) return;

  const cart = getCart();
  const isBed = isBedProduct(CURRENT_PRODUCT_SHORT);

  const existing = cart.find(x =>
    x.slug === CURRENT_PRODUCT_SHORT.slug &&
    x.selected_fabric_category === PRODUCT_STATE.selectedCategory &&
    x.selected_fabric_name === PRODUCT_STATE.selectedFabricLabel &&
    (!isBed || (
      x.selected_bed_size === PRODUCT_STATE.selectedBedSize &&
      !!x.selected_bed_ortho === !!PRODUCT_STATE.selectedBedOrtho &&
      !!x.selected_bed_box === !!PRODUCT_STATE.selectedBedBox
    ))
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: CURRENT_PRODUCT_SHORT.id,
      slug: CURRENT_PRODUCT_SHORT.slug,
      name: CURRENT_PRODUCT.name,
      category: CURRENT_PRODUCT_SHORT.category,
      base_price: isBed ? getBedBasePrice() : CURRENT_PRODUCT.price,
      selected_fabric_category: PRODUCT_STATE.selectedCategory,
      selected_fabric_category_name: FABRIC_CATEGORY_NAMES[PRODUCT_STATE.selectedCategory],
      selected_fabric_name: PRODUCT_STATE.selectedFabricLabel,
      selected_fabric_file: PRODUCT_STATE.selectedFabricFile,
      selected_fabric_path: PRODUCT_STATE.selectedFabricFile
        ? `./assets/fabrics/category-${PRODUCT_STATE.selectedCategory}/${PRODUCT_STATE.selectedFabricFile}`
        : null,
      selected_bed_size: isBed ? PRODUCT_STATE.selectedBedSize : null,
      selected_bed_ortho: isBed ? PRODUCT_STATE.selectedBedOrtho : null,
      selected_bed_box: isBed ? PRODUCT_STATE.selectedBedBox : null,
      final_price: getCurrentProductFinalPrice(),
      qty: 1,
      selected: true,
      photo: CURRENT_PRODUCT.photos?.[0] || null
    });
  }

  saveCurrentProductState();
  setCart(cart);
  showToast('Товар добавлен в корзину');
}

window.changeProductPhoto = changeProductPhoto;
window.openFabricCategorySheet = openFabricCategorySheet;
window.openFabricColorSheet = openFabricColorSheet;
window.closeFabricSheets = closeFabricSheets;
window.addSimpleToCart = addSimpleToCart;
window.increaseCatalogQty = increaseCatalogQty;
window.decreaseCatalogQty = decreaseCatalogQty;
window.toggleFavoriteBySlug = toggleFavoriteBySlug;
window.goBackSmart = goBackSmart;
window.increaseCartItem = increaseCartItem;
window.decreaseCartItem = decreaseCartItem;
window.removeCartItem = removeCartItem;
window.toggleCartItemSelected = toggleCartItemSelected;
window.selectBedSize = selectBedSize;
window.selectBedOrtho = selectBedOrtho;
window.selectBedBox = selectBedBox;
window.openProductLightbox = openProductLightbox;
window.closeProductLightbox = closeProductLightbox;
window.nextProductLightbox = nextProductLightbox;
window.prevProductLightbox = prevProductLightbox;
window.goToProductLightboxSlide = goToProductLightboxSlide;
window.shareCurrentProduct = shareCurrentProduct;
window.selectAllCartItems = selectAllCartItems;
window.unselectAllCartItems = unselectAllCartItems;
window.removeSelectedCartItems = removeSelectedCartItems;

(async function initApp() {
  await loadProducts();
  updateCartBadge();
  updateFavoritesBadge();
  if (document.getElementById('catalog-list')) renderCatalogPage();
  if (document.getElementById('favorites-list')) renderFavoritesPage();
  renderHomePage();
  if (document.getElementById('category-page-title')) renderCategoryPage();
  if (document.getElementById('product-list-title')) renderProductListPage();
  if (document.getElementById('product-page-root')) {
    await loadCurrentProduct();
    renderProductPage();
  }
  if (document.getElementById('cart-list')) renderCartPage();
  if (document.getElementById('checkout-button')) renderCheckoutPage();
})();

function buildCustomRequestText() {
  const type = document.querySelector('input[name="custom-type"]:checked')?.value || '';
  const name = document.getElementById('custom-name')?.value?.trim() || '';
  const phone = document.getElementById('custom-phone')?.value?.trim() || '';
  const city = document.getElementById('custom-city')?.value?.trim() || '';
  const model = document.getElementById('custom-model')?.value?.trim() || '';
  const width = document.getElementById('custom-width')?.value?.trim() || '';
  const depth = document.getElementById('custom-depth')?.value?.trim() || '';
  const height = document.getElementById('custom-height')?.value?.trim() || '';
  const fabric = document.getElementById('custom-fabric')?.value?.trim() || '';
  const comment = document.getElementById('custom-comment')?.value?.trim() || '';

  return [
    'Нестандартный заказ',
    '',
    `Тип: ${type}`,
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Город: ${city}`,
    `Модель / ссылка: ${model}`,
    `Ширина: ${width}`,
    `Глубина: ${depth}`,
    `Высота: ${height}`,
    `Ткань / цвет: ${fabric}`,
    `Комментарий: ${comment}`
  ].join('\n');
}

function copyCustomRequest() {
  const text = buildCustomRequestText();
  navigator.clipboard.writeText(text)
    .then(() => showToast('Текст заявки скопирован'))
    .catch(() => showToast('Не удалось скопировать текст'));
}

function sendCustomToWhatsApp() {
  const text = buildCustomRequestText();
  const url = `https://wa.me/79851060099?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

function sendCustomToTelegram() {
  const text = buildCustomRequestText();
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast('Текст скопирован, сейчас откроется Telegram');
      setTimeout(() => window.open('https://t.me/vitalik_gunchak', '_blank'), 300);
    })
    .catch(() => {
      window.open('https://t.me/vitalik_gunchak', '_blank');
    });
}

function sendCustomToMax() {
  const text = buildCustomRequestText();
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast('Текст скопирован. Вставьте его в Max');
      window.open('https://max.ru/', '_blank');
    })
    .catch(() => {
      window.open('https://max.ru/', '_blank');
    });
}

window.copyCustomRequest = copyCustomRequest;
window.sendCustomToWhatsApp = sendCustomToWhatsApp;
window.sendCustomToTelegram = sendCustomToTelegram;
window.sendCustomToMax = sendCustomToMax;

function getCategoryQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderCategoryPage() {
  const titleEl = document.getElementById('category-page-title');
  const chipsEl = document.getElementById('category-quick-chips');
  const subgroupsEl = document.getElementById('category-subgroups');
  const productsEl = document.getElementById('category-products');

  if (!titleEl || !chipsEl || !subgroupsEl || !productsEl) return;

  const group = getCategoryQueryParam('group') || 'divany';

  const groupMap = {
    divany: {
      title: 'Диваны',
      chips: ['Раскладные', 'Нераскладные', 'Компактные', 'Премиум', 'Новинки'],
      subgroups: [
        { title: 'Двухместные', image: './assets/categories/divany.jpg', link: './product-list.html?category=divany-2' },
        { title: 'Трёхместные', image: './assets/categories/divany.jpg', link: './product-list.html?category=divany-3' },
        { title: 'Угловые', image: './assets/categories/divany.jpg', link: './product-list.html?category=uglovye' }
      ]
    },
    krovati: {
      title: 'Кровати',
      chips: ['С ящиком', '160×200', '180×200', 'До 70 000 ₽', 'От 100 000 ₽'],
      subgroups: [
        { title: 'Все кровати', image: './assets/categories/beds.jpg', link: './product-list.html?category=krovati' }
      ]
    },
    kresla: {
      title: 'Кресла',
      chips: ['Мягкие', 'До 30 000 ₽', 'До 70 000 ₽', 'От 100 000 ₽'],
      subgroups: []
    },
    pufy: {
      title: 'Пуфы',
      chips: ['Мягкие', 'До 30 000 ₽', 'До 70 000 ₽', 'От 100 000 ₽'],
      subgroups: []
    }
  };

  const data = groupMap[group];
  if (!data) return;

  titleEl.textContent = data.title;

  chipsEl.innerHTML = data.chips.map(chip => `
    <button class="category-chip" onclick="showToast('Фильтр ' + '${chip}' + ' подключим следующим этапом')">${chip}</button>
  `).join('');

  if (data.subgroups.length) {
    subgroupsEl.innerHTML = data.subgroups.map(item => `
      <article class="category-subcard glass glass-strong" onclick="window.location.href='${item.link}'">
        <img src="${item.image}" alt="${item.title}">
        <div class="catalog-group-overlay"></div>
        <div class="category-subcard-title">${item.title}</div>
      </article>
    `).join('');
    productsEl.innerHTML = '';
  } else {
    subgroupsEl.innerHTML = '';
    productsEl.innerHTML = `
      <section class="cart-empty glass glass-strong">
        <h3>Раздел готовим</h3>
        <p>Следующим этапом сюда подключим реальные товары и фильтры.</p>
      </section>
    `;
  }
}


function sortProductListItems(items, mode) {
  const arr = [...items];

  if (mode === 'price-asc') {
    return arr.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }

  if (mode === 'price-desc') {
    return arr.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  }

  if (mode === 'name-asc') {
    return arr.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ru'));
  }

  return arr;
}

function getProductListConfig(category) {
  const map = {
    'divany-2': {
      title: 'Двухместные диваны',
      chips: ['Раскладные', 'Нераскладные', 'До 30 000 ₽', 'До 70 000 ₽', 'От 100 000 ₽']
    },
    'divany-3': {
      title: 'Трёхместные диваны',
      chips: ['Раскладные', 'Нераскладные', 'До 30 000 ₽', 'До 70 000 ₽', 'От 100 000 ₽']
    },
    'uglovye': {
      title: 'Угловые диваны',
      chips: ['Раскладные', 'Нераскладные', 'С ящиком', 'До 70 000 ₽', 'От 100 000 ₽']
    },
    'krovati': {
      title: 'Кровати',
      chips: ['С ящиком', '160×200', '180×200', 'До 70 000 ₽', 'От 100 000 ₽']
    },
    'kresla': {
      title: 'Кресла',
      chips: ['Мягкие', 'До 30 000 ₽', 'До 70 000 ₽', 'От 100 000 ₽']
    },
    'pufy': {
      title: 'Пуфы',
      chips: ['Мягкие', 'До 30 000 ₽', 'До 70 000 ₽', 'От 100 000 ₽']
    }
  };

  return map[category] || { title: 'Товары', chips: [] };
}

function chipMatchesProduct(chip, product) {
  const filters = product.filters || {};
  const text = `${product.name || ''} ${product.description || ''} ${product.short_specs || ''}`.toLowerCase();
  const price = Number(product.price || 0);

  if (chip === 'Раскладные') {
    return filters.is_folding === true;
  }

  if (chip === 'Нераскладные') {
    return filters.is_folding === false;
  }

  if (chip === 'С ящиком') {
    return filters.has_storage === true || text.includes('ящик');
  }

  if (chip === 'До 30 000 ₽') {
    return price > 0 && price <= 30000;
  }

  if (chip === 'До 70 000 ₽') {
    return price > 0 && price <= 70000;
  }

  if (chip === 'От 100 000 ₽') {
    return price >= 100000;
  }

  if (chip === '160×200') {
    return text.includes('160') && text.includes('200');
  }

  if (chip === '180×200') {
    return text.includes('180') && text.includes('200');
  }

  if (chip === 'Мягкие') {
    return text.includes('мягк') || text.includes('ппу') || text.includes('холлофайбер') || text.includes('холофайбер');
  }

  if (chip === 'Новинки') {
    return true;
  }

  return true;
}


function renderProductListPage() {
  updateProductFilterBadge();

  const titleEl = document.getElementById('product-list-title');
  const searchEl = document.getElementById('product-list-search');
  const chipsEl = document.getElementById('product-list-chips');
  const gridEl = document.getElementById('product-list-grid');
  const sortEl = document.getElementById('product-list-sort');

  if (!titleEl || !searchEl || !chipsEl || !gridEl) return;

  const category = getQueryParam('category') || 'divany-2';
  const config = getProductListConfig(category);
  titleEl.textContent = config.title;

  let activeChip = null;

  function paint() {
    const q = searchEl.value.trim().toLowerCase();
    const sortMode = sortEl ? sortEl.value : 'default';

    let items = PRODUCTS.filter(item => item.category === category);

    if (q) {
      items = items.filter(item => {
        const hay = `${item.name || ''} ${item.description || ''} ${item.short_specs || ''}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (activeChip) {
      items = items.filter(item => chipMatchesProduct(activeChip, item));
    }

    items = items.filter(item => productPassesAdvancedFilters(item));
    items = sortProductListItems(items, sortMode);

    if (!items.length) {
      gridEl.innerHTML = `
        <section class="cart-empty glass glass-strong">
          <h3>Товаров не найдено</h3>
          <p>Попробуйте изменить поиск, сортировку или фильтры.</p>
        </section>
      `;
      return;
    }

    gridEl.innerHTML = items.map(item => {
      const qty = getCatalogCartQty(item);

      const actionHtml = qty > 0
        ? `
          <div class="catalog-qty-box">
            <button class="catalog-qty-btn" onclick="decreaseCatalogQty(${item.id})">−</button>
            <div class="catalog-qty-value">${qty}</div>
            <button class="catalog-qty-btn" onclick="increaseCatalogQty(${item.id})">+</button>
          </div>
        `
        : `
          <button class="primary-btn" onclick="addSimpleToCart(${item.id})">🛒 В корзину</button>
        `;

      return `
        <article class="product-catalog-card glass glass-strong">
          <a href="./product.html?id=${item.id}" class="product-catalog-link">
            <div class="product-catalog-image-wrap">
              <img src="${item.photos?.[0] || ''}" alt="${item.name}" class="product-catalog-image">
              <button class="catalog-fav-btn" onclick="event.preventDefault();event.stopPropagation();toggleFavoriteBySlug('${item.slug}')">
                ${isFavorite(item.slug) ? '♥' : '♡'}
              </button>
            </div>
          </a>
          <div class="product-catalog-body">
            <div class="product-catalog-badge">${item.badge || 'Модель'}</div>
            <a href="./product.html?id=${item.id}" class="product-catalog-title">${getDisplayProductName(item)}</a>
            <div class="product-catalog-specs">${item.short_specs || ''}</div>
            <div class="product-catalog-price-row">
              <div class="product-catalog-price">${formatPrice(item.price)}</div>
              <div class="product-catalog-old-price">${formatPrice(item.old_price || Math.round(item.price * 1.3))}</div>
            </div>
            <div class="product-catalog-actions">
              ${actionHtml}
              <a href="./product.html?id=${item.id}" class="ghost-btn product-open-btn">Открыть</a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  chipsEl.innerHTML = config.chips.map(chip => `
    <button class="category-chip" data-chip="${chip}">${chip}</button>
  `).join('');

  chipsEl.querySelectorAll('.category-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const chip = btn.dataset.chip;
      activeChip = activeChip === chip ? null : chip;

      chipsEl.querySelectorAll('.category-chip').forEach(x => x.classList.remove('category-chip-active'));
      if (activeChip) btn.classList.add('category-chip-active');

      paint();
    });
  });

  searchEl.removeEventListener?.('input', paint);
  searchEl.addEventListener('input', paint);

  if (sortEl) {
    sortEl.onchange = paint;
  }

  paint();
}

let PRODUCT_LIST_FILTERS = {
  priceMin: '',
  priceMax: '',
  onlyFolding: false,
  onlyNonFolding: false,
  onlyUnder70: false,
  onlyOver100: false
};

function openFilterSheet() {
  const el = document.getElementById('product-filter-sheet');
  if (!el) return;

  document.getElementById('filter-price-min').value = PRODUCT_LIST_FILTERS.priceMin || '';
  document.getElementById('filter-price-max').value = PRODUCT_LIST_FILTERS.priceMax || '';
  document.getElementById('filter-only-folding').checked = !!PRODUCT_LIST_FILTERS.onlyFolding;
  document.getElementById('filter-only-nonfolding').checked = !!PRODUCT_LIST_FILTERS.onlyNonFolding;
  const under70 = document.getElementById('filter-price-70');
  const over100 = document.getElementById('filter-price-100plus');
  if (under70) under70.checked = !!PRODUCT_LIST_FILTERS.onlyUnder70;
  if (over100) over100.checked = !!PRODUCT_LIST_FILTERS.onlyOver100;

  el.style.display = 'block';
}

function closeFilterSheet() {
  const el = document.getElementById('product-filter-sheet');
  if (el) el.style.display = 'none';
}

function resetProductFilters() {
  PRODUCT_LIST_FILTERS = {
    priceMin: '',
    priceMax: '',
    onlyFolding: false,
    onlyNonFolding: false,
    onlyUnder70: false,
    onlyOver100: false
  };
  updateProductFilterBadge();
  closeFilterSheet();
  renderProductListPage();
}

function applyProductFilters() {
  PRODUCT_LIST_FILTERS = {
    priceMin: document.getElementById('filter-price-min')?.value || '',
    priceMax: document.getElementById('filter-price-max')?.value || '',
    onlyFolding: !!document.getElementById('filter-only-folding')?.checked,
    onlyNonFolding: !!document.getElementById('filter-only-nonfolding')?.checked,
    onlyUnder70: !!document.getElementById('filter-price-70')?.checked,
    onlyOver100: !!document.getElementById('filter-price-100plus')?.checked
  };

  if (PRODUCT_LIST_FILTERS.onlyFolding && PRODUCT_LIST_FILTERS.onlyNonFolding) {
    PRODUCT_LIST_FILTERS.onlyNonFolding = false;
  }
  if (PRODUCT_LIST_FILTERS.onlyUnder70 && PRODUCT_LIST_FILTERS.onlyOver100) {
    PRODUCT_LIST_FILTERS.onlyOver100 = false;
  }

  updateProductFilterBadge();
  closeFilterSheet();
  renderProductListPage();
}

function productPassesAdvancedFilters(product) {
  const filters = product.filters || {};
  const price = Number(product.price || 0);

  const min = Number(PRODUCT_LIST_FILTERS.priceMin || 0);
  const max = Number(PRODUCT_LIST_FILTERS.priceMax || 0);

  if (min && price < min) return false;
  if (max && price > max) return false;

  if (PRODUCT_LIST_FILTERS.onlyFolding) {
    if (filters.is_folding === false) return false;
  }

  if (PRODUCT_LIST_FILTERS.onlyNonFolding) {
    if (filters.is_folding === true) return false;
  }

  if (PRODUCT_LIST_FILTERS.onlyUnder70) {
    if (!(price > 0 && price <= 70000)) return false;
  }

  if (PRODUCT_LIST_FILTERS.onlyOver100) {
    if (!(price >= 100000)) return false;
  }

  return true;
}

window.openFilterSheet = openFilterSheet;
window.closeFilterSheet = closeFilterSheet;
window.resetProductFilters = resetProductFilters;
window.applyProductFilters = applyProductFilters;


function updateProductFilterBadge() {
  const badge = document.getElementById('product-filter-badge');
  if (!badge) return;

  let count = 0;
  if (PRODUCT_LIST_FILTERS.priceMin) count++;
  if (PRODUCT_LIST_FILTERS.priceMax) count++;
  if (PRODUCT_LIST_FILTERS.onlyFolding) count++;
  if (PRODUCT_LIST_FILTERS.onlyNonFolding) count++;
  if (PRODUCT_LIST_FILTERS.onlyUnder70) count++;
  if (PRODUCT_LIST_FILTERS.onlyOver100) count++;

  if (!count) {
    badge.style.display = 'none';
    badge.textContent = '0';
    return;
  }

  badge.style.display = 'inline-flex';
  badge.textContent = String(count);
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getHomeDisplayProductName(product) {
  return getDisplayProductName(product);
}

function renderHomePickedProducts(tab = 'hits') {
  const root = document.getElementById('home-picked-products');
  if (!root) return;

  let items = [...PRODUCTS];

  if (tab === 'hits') {
    items = [...items].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  } else if (tab === 'new') {
    items = [...items].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  } else {
    items = shuffleArray(items);
  }

  items = items.slice(0, 10);

  root.innerHTML = items.map(item => {
    const qty = getCatalogCartQty(item);

    const actionHtml = qty > 0
      ? `
        <div class="catalog-qty-box">
          <button class="catalog-qty-btn" onclick="decreaseCatalogQty(${item.id})">−</button>
          <div class="catalog-qty-value">${qty}</div>
          <button class="catalog-qty-btn" onclick="increaseCatalogQty(${item.id})">+</button>
        </div>
      `
      : `
        <button class="primary-btn" onclick="addSimpleToCart(${item.id})">🛒 В корзину</button>
      `;

    return `
      <article class="product-catalog-card glass glass-strong">
        <a href="./product.html?id=${item.id}" class="product-catalog-link">
          <div class="product-catalog-image-wrap">
            <img src="${item.photos?.[0] || ''}" alt="${item.name}" class="product-catalog-image">
            <button class="catalog-fav-btn" onclick="event.preventDefault();event.stopPropagation();toggleFavoriteBySlug('${item.slug}')">
              ${isFavorite(item.slug) ? '♥' : '♡'}
            </button>
          </div>
        </a>
        <div class="product-catalog-body">
          <div class="product-catalog-badge">${item.badge || 'Модель'}</div>
          <a href="./product.html?id=${item.id}" class="product-catalog-title">${getHomeDisplayProductName(item)}</a>
          <div class="product-catalog-specs">${item.short_specs || ''}</div>
          <div class="product-catalog-price-row">
            <div class="product-catalog-price">${formatPrice(item.price)}</div>
            <div class="product-catalog-old-price">${formatPrice(item.old_price || Math.round(item.price * 1.3))}</div>
          </div>
          <div class="product-catalog-actions">
            ${actionHtml}
            <a href="./product.html?id=${item.id}" class="ghost-btn product-open-btn">Открыть</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function bindHomeTabs() {
  const tabs = document.querySelectorAll('.home-tab');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      tab.classList.add('active');
      renderHomePickedProducts(tab.dataset.homeTab);
    });
  });
}

function renderHomeFabrics() {
  const root = document.getElementById('home-fabrics-grid');
  if (!root) return;

  const fabrics = [
    { name: 'Velutto', cat: 'Категория 1', image: './assets/fabrics/category-1/velutto01_570x480.jpg' },
    { name: 'Evita', cat: 'Категория 2', image: './assets/fabrics/category-2/1.jpg' },
    { name: 'Kiton', cat: 'Категория 3', image: './assets/fabrics/category-3/1.jpg' },
    { name: 'Diagonal', cat: 'Категория 4', image: './assets/fabrics/category-4/1.jpg' },
    { name: 'Marbel', cat: 'Категория 5', image: './assets/fabrics/category-5/1.jpg' },
    { name: 'Premier', cat: 'Категория 6', image: './assets/fabrics/category-6/1.jpg' },
    { name: 'Piano', cat: 'Категория 7', image: './assets/fabrics/category-7/1.jpg' },
    { name: 'Belgium', cat: 'Категория 8', image: './assets/fabrics/category-8/1.jpg' }
  ];

  root.innerHTML = fabrics.map(item => `
    <article class="home-fabric-card">
      <img src="${item.image}" alt="${item.name}" onerror="this.src='./assets/categories/divany.jpg'">
      <div class="home-fabric-meta">
        <div class="home-fabric-name">${item.name}</div>
        <div class="home-fabric-cat">${item.cat}</div>
      </div>
    </article>
  `).join('');
}

function renderHomeReviews() {
  const root = document.getElementById('home-reviews-row');
  if (!root) return;

  const reviews = [
    { name: 'Анна', text: 'Очень понравилось качество мебели и работа менеджера. Всё аккуратно, красиво и в срок.' },
    { name: 'Ирина', text: 'Заказывали диван под интерьер. Помогли с тканью, сделали достойно.' },
    { name: 'Олег', text: 'Мебель выглядит дорого, швы ровные, посадка комфортная. Спасибо.' },
    { name: 'Марина', text: 'Приятно, что можно выбрать материал и размер. Это большой плюс.' },
    { name: 'Сергей', text: 'Доставка прошла нормально, диван собрали быстро, качество отличное.' },
    { name: 'Елена', text: 'Заказывали кровать. Очень достойный внешний вид и хорошая ткань.' },
    { name: 'Диана', text: 'Понравился подход к деталям и аккуратность изготовления.' },
    { name: 'Руслан', text: 'Сделали заказ без лишней суеты. Всё чётко и по делу.' },
    { name: 'Алина', text: 'Красивый современный дизайн, мебель хорошо смотрится в интерьере.' },
    { name: 'Павел', text: 'Хорошее качество за свои деньги. Планируем заказывать ещё.' }
  ];

  root.innerHTML = reviews.map(item => `
    <article class="home-review-card">
      <div class="home-review-top">
        <div class="home-review-avatar">${item.name.charAt(0)}</div>
        <div>
          <div class="home-review-name">${item.name}</div>
          <div class="home-review-stars">★★★★★</div>
        </div>
      </div>
      <div class="home-review-text">${item.text}</div>
    </article>
  `).join('');
}


let HOME_SLIDER_INDEX = 0;

function updateHomeSlider() {
  const slides = document.querySelectorAll('.home-hero-slide');
  const dots = document.querySelectorAll('.home-hero-dot');
  if (!slides.length) return;

  slides.forEach((slide, i) => slide.classList.toggle('active', i === HOME_SLIDER_INDEX));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === HOME_SLIDER_INDEX));
}

function nextHomeSlide() {
  const slides = document.querySelectorAll('.home-hero-slide');
  if (!slides.length) return;
  HOME_SLIDER_INDEX = (HOME_SLIDER_INDEX + 1) % slides.length;
  updateHomeSlider();
}

function prevHomeSlide() {
  const slides = document.querySelectorAll('.home-hero-slide');
  if (!slides.length) return;
  HOME_SLIDER_INDEX = (HOME_SLIDER_INDEX - 1 + slides.length) % slides.length;
  updateHomeSlider();
}

function startHomeHeroSlider() {
  const slides = document.querySelectorAll('.home-hero-slide');
  const dotsRoot = document.getElementById('home-hero-dots');
  if (!slides.length || !dotsRoot) return;

  HOME_SLIDER_INDEX = 0;
  dotsRoot.innerHTML = '';

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'home-hero-dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => {
      HOME_SLIDER_INDEX = i;
      updateHomeSlider();
    };
    dotsRoot.appendChild(dot);
  });

  updateHomeSlider();

  if (window.__homeSliderTimer) clearInterval(window.__homeSliderTimer);
  window.__homeSliderTimer = setInterval(() => {
    nextHomeSlide();
  }, 2000);
}

window.nextHomeSlide = nextHomeSlide;
window.prevHomeSlide = prevHomeSlide;


function buildHelpRequestText() {
  const name = document.getElementById('home-help-name')?.value?.trim() || '';
  const phone = document.getElementById('home-help-phone')?.value?.trim() || '';
  const call = document.getElementById('home-help-call')?.checked ? 'Да' : 'Нет';
  const write = document.getElementById('home-help-write')?.checked ? 'Да' : 'Нет';

  return [
    'Заявка с главной страницы',
    '',
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Позвонить: ${call}`,
    `Написать: ${write}`
  ].join('\\n');
}

function sendHelpRequestWhatsApp() {
  const text = buildHelpRequestText();
  window.open(`https://wa.me/79851060099?text=${encodeURIComponent(text)}`, '_blank');
}

function sendHelpRequestTelegram() {
  const text = buildHelpRequestText();
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast('Текст скопирован, открываем Telegram');
      setTimeout(() => window.open('https://t.me/vitalik_gunchak', '_blank'), 300);
    })
    .catch(() => window.open('https://t.me/vitalik_gunchak', '_blank'));
}

window.sendHelpRequestWhatsApp = sendHelpRequestWhatsApp;
window.sendHelpRequestTelegram = sendHelpRequestTelegram;

function renderHomePage() {
  if (!document.querySelector('.home-page-premium')) return;
  renderHomePickedProducts('hits');
  bindHomeTabs();
  renderHomeFabrics();
  renderHomeReviews();
  startHomeHeroSlider();
}


document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('product-lightbox');
  if (!modal || modal.style.display === 'none') return;

  if (e.key === 'Escape') closeProductLightbox();
  if (e.key === 'ArrowRight') nextProductLightbox();
  if (e.key === 'ArrowLeft') prevProductLightbox();
});



function bindProductLightboxSwipe() {
  const zone = document.getElementById('product-lightbox-swipe');
  if (!zone || zone.dataset.swipeBound === '1') return;

  let startX = 0;
  let startY = 0;
  let deltaX = 0;
  let deltaY = 0;

  zone.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
    deltaX = 0;
    deltaY = 0;
  }, { passive: true });

  zone.addEventListener('touchmove', (e) => {
    const t = e.changedTouches[0];
    deltaX = t.clientX - startX;
    deltaY = t.clientY - startY;
  }, { passive: true });

  zone.addEventListener('touchend', () => {
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) nextProductLightbox();
      else prevProductLightbox();
    }
  }, { passive: true });

  zone.dataset.swipeBound = '1';
}



function bindProductLightboxZoom() {
  const zone = document.getElementById('product-lightbox-swipe');
  const img = document.getElementById('product-lightbox-image');
  if (!zone || !img || zone.dataset.zoomBound === '1') return;

  zone.addEventListener('wheel', (e) => {
    e.preventDefault();

    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    let nextScale = PRODUCT_LIGHTBOX_STATE.scale + delta;
    nextScale = Math.max(1, Math.min(4, nextScale));
    PRODUCT_LIGHTBOX_STATE.scale = nextScale;

    if (nextScale === 1) {
      PRODUCT_LIGHTBOX_STATE.x = 0;
      PRODUCT_LIGHTBOX_STATE.y = 0;
    }

    applyProductLightboxTransform();
  }, { passive: false });

  img.addEventListener('dblclick', () => {
    PRODUCT_LIGHTBOX_STATE.scale = PRODUCT_LIGHTBOX_STATE.scale > 1 ? 1 : 2;
    if (PRODUCT_LIGHTBOX_STATE.scale === 1) {
      PRODUCT_LIGHTBOX_STATE.x = 0;
      PRODUCT_LIGHTBOX_STATE.y = 0;
    }
    applyProductLightboxTransform();
  });

  img.addEventListener('pointerdown', (e) => {
    if (PRODUCT_LIGHTBOX_STATE.scale <= 1) return;
    PRODUCT_LIGHTBOX_STATE.dragging = true;
    PRODUCT_LIGHTBOX_STATE.startX = e.clientX;
    PRODUCT_LIGHTBOX_STATE.startY = e.clientY;
    PRODUCT_LIGHTBOX_STATE.originX = PRODUCT_LIGHTBOX_STATE.x;
    PRODUCT_LIGHTBOX_STATE.originY = PRODUCT_LIGHTBOX_STATE.y;
    img.classList.add('dragging');
  });

  window.addEventListener('pointermove', (e) => {
    if (!PRODUCT_LIGHTBOX_STATE.dragging) return;
    PRODUCT_LIGHTBOX_STATE.x = PRODUCT_LIGHTBOX_STATE.originX + (e.clientX - PRODUCT_LIGHTBOX_STATE.startX);
    PRODUCT_LIGHTBOX_STATE.y = PRODUCT_LIGHTBOX_STATE.originY + (e.clientY - PRODUCT_LIGHTBOX_STATE.startY);
    applyProductLightboxTransform();
  });

  window.addEventListener('pointerup', () => {
    PRODUCT_LIGHTBOX_STATE.dragging = false;
    img.classList.remove('dragging');
  });

  zone.addEventListener('touchend', () => {
    const now = Date.now();
    if (now - PRODUCT_LIGHTBOX_STATE.lastTap < 300) {
      PRODUCT_LIGHTBOX_STATE.scale = PRODUCT_LIGHTBOX_STATE.scale > 1 ? 1 : 2;
      if (PRODUCT_LIGHTBOX_STATE.scale === 1) {
        PRODUCT_LIGHTBOX_STATE.x = 0;
        PRODUCT_LIGHTBOX_STATE.y = 0;
      }
      applyProductLightboxTransform();
    }
    PRODUCT_LIGHTBOX_STATE.lastTap = now;
  }, { passive: true });

  zone.dataset.zoomBound = '1';
}
