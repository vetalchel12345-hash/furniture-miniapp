
let allProducts = []
let filteredProducts = []
let currentSort = "price-asc"

async function loadProducts() {
  const res = await fetch("./data/products.json")
  allProducts = await res.json()
  filteredProducts = [...allProducts]
  renderProducts()
}

function sortProducts(products, mode) {
  const arr = [...products]

  switch (mode) {

    case "price-asc":
      return arr.sort((a, b) => (a.price || 0) - (b.price || 0))

    case "price-desc":
      return arr.sort((a, b) => (b.price || 0) - (a.price || 0))

    case "popular":
      return arr.sort((a, b) =>
        (b.reviews_count || 0) - (a.reviews_count || 0)
      )

    case "new":
      return arr.sort((a, b) =>
        (b.id || 0) - (a.id || 0)
      )

    default:
      return arr
  }
}

function renderProducts() {

  const container = document.getElementById("products")

  let sorted = sortProducts(filteredProducts, currentSort)

  container.innerHTML = sorted.map(p => `
    <div class="product-card">
      <img src="${p.photos?.[0] || ''}" class="product-image"/>
      <div class="product-title">${p.name}</div>
      <div class="product-price">${p.price.toLocaleString()} ₽</div>
    </div>
  `).join("")
}

const sortSelect = document.getElementById("sortSelect")

if (sortSelect) {
  sortSelect.addEventListener("change", e => {
    currentSort = e.target.value
    renderProducts()
  })
}

loadProducts()

