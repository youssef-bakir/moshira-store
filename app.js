// app.js
// ================================
// إدارة المتجر: المنتجات، المفضلة، السلة، الفلاتر، Quick View
// ================================

// ======== عناصر DOM أساسية ========
const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchInput');
const stockFilter = document.getElementById('stockFilter');
const sortBySelect = document.getElementById('sortBy');
const perPageSelect = document.getElementById('perPage');
const paginationPrev = document.getElementById('prevPage');
const paginationNext = document.getElementById('nextPage');

const favPanel = document.getElementById('favPanel');
const favList = document.getElementById('favList');
const favCountTop = document.getElementById('favCountTop');

const cartPanelProducts = document.getElementById('cartPanelProducts');
const cartItemsProducts = document.getElementById('cartItemsProducts');
const cartCountTop = document.getElementById('cartCountTop');
const cartTotalProducts = document.getElementById('cartTotalProducts');

const quickView = document.getElementById('quickView');
const qvClose = document.getElementById('qvClose');
const qvTitle = document.getElementById('qvTitle');
const qvImg = document.getElementById('qvImg');
const qvDesc = document.getElementById('qvDesc');
const qvPrice = document.getElementById('qvPrice');
const qvAdd = document.getElementById('qvAdd');
const qvFav = document.getElementById('qvFav');
const qvSize = document.getElementById('qvSize');

// عناصر الأدوات
const favBtnTop = document.getElementById('favBtnTop');
const cartBtnTop = document.getElementById('cartBtnTop');

// =====================
// بيانات المتجر
// =====================
let products = window.SHOP_PRODUCTS || [];
let perPage = window.SHOP_PAGE ? window.SHOP_PAGE.perPage : 6;
let currentPage = 1;

// المفضلة والسلة من localStorage
let favs = JSON.parse(localStorage.getItem('SHOP_FAV') || '[]');
let cart = JSON.parse(localStorage.getItem('SHOP_CART') || '[]');

// =====================
// الدوال الأساسية
// =====================

// حفظ البيانات في localStorage
function saveFavs() { localStorage.setItem('SHOP_FAV', JSON.stringify(favs)); }
function saveCart() { localStorage.setItem('SHOP_CART', JSON.stringify(cart)); }

// تحديث عدادات المفضلة والسلة في الهيدر
function updateCounters() {
  favCountTop.textContent = favs.length;
  cartCountTop.textContent = cart.reduce((a,b)=>a+b.qty,0);
}

// عرض المنتجات مع الفلاتر والبحث
function renderProducts() {
  if(!productsGrid) return;

  // تصفية حسب البحث
  let filtered = products.filter(p=>{
    const keyword = searchInput ? searchInput.value.trim() : '';
    if(keyword==='') return true;
    return p.title.includes(keyword) || (p.desc && p.desc.includes(keyword));
  });

  // تصفية حسب المخزون
  if(stockFilter){
    const stockVal = stockFilter.value;
    if(stockVal==='in') filtered = filtered.filter(p=>p.inStock);
    if(stockVal==='sold') filtered = filtered.filter(p=>!p.inStock);
  }

  // ترتيب
  if(sortBySelect){
    const sortVal = sortBySelect.value;
    if(sortVal==='price-asc') filtered.sort((a,b)=>a.price-b.price);
    if(sortVal==='price-desc') filtered.sort((a,b)=>b.price-a.price);
    if(sortVal==='new') filtered.sort((a,b)=>b.id-b.id);
  }

  // Pagination
  const totalPages = Math.ceil(filtered.length / perPage);
  if(currentPage>totalPages) currentPage=1;
  const start = (currentPage-1)*perPage;
  const paginated = filtered.slice(start, start+perPage);

  productsGrid.innerHTML='';
  if(paginated.length===0){
    productsGrid.innerHTML='<p>لا توجد منتجات متاحة</p>';
    return;
  }

  paginated.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'prod-card';
    if(!p.inStock) card.classList.add('sold-out');

    card.innerHTML=`
      <img src="${p.img}" alt="${p.title}" />
      <div class="prod-meta">
        <h4>${p.title}</h4>
        <div class="price">${p.price} ج.م</div>
      </div>
      <div class="prod-actions">
        <button class="fav-btn" data-id="${p.id}" title="أضف للمفضلة">♡</button>
        <button class="add-btn" data-id="${p.id}" ${p.inStock?'':'disabled'}>${p.inStock?'أضف للسلة':'نفدت الكمية'}</button>
      </div>
    `;
    productsGrid.appendChild(card);
  });

  renderFavBtns();
  renderAddBtns();
}

// =====================
// إدارة المفضلة
// =====================
function renderFavBtns() {
  document.querySelectorAll('.fav-btn').forEach(btn=>{
    const id = parseInt(btn.dataset.id);
    if(favs.includes(id)) btn.textContent='';
    btn.onclick=()=>toggleFav(id,btn);
  });
}

// function toggleFav(id,btn){
//   if(favs.includes(id)){
//     favs = favs.filter(x=>x!==id);
//     btn.textContent='♡';
//   }else{
//     favs.push(id);
//     btn.textContent='♥';
//   }
//   saveFavs();
//   updateCounters();
//   renderFavPanel();
// }
// دالة تبديل المفضلة — تستخدم innerHTML لتبديل الأيقونة فقط
function saveFavs() {
  localStorage.setItem('SHOP_FAV', JSON.stringify(favs));
}



// تبديل حالة المفضلة عند الضغط
function toggleFav(id, btn) {
  const pid = typeof id === 'string' ? parseInt(id) : id;

  if(favs.includes(pid)) {
    favs = favs.filter(x => x !== pid);
    btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
    btn.setAttribute('aria-pressed','false');
    btn.title = 'أضف للمفضلة';
  } else {
    favs.push(pid);
    btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
    btn.setAttribute('aria-pressed','true');
    btn.title = 'إزالة من المفضلة';
  }

  saveFavs();
  updateCounters();
  renderFavPanel && renderFavPanel();
}

// تهيئة جميع أزرار المفضلة بعد تحميل الصفحة أو بعد renderProducts()
function attachFavButtons() {
  document.querySelectorAll('.fav-btn').forEach(btn => {
    const id = btn.dataset.id ? parseInt(btn.dataset.id) : null;
    if(!id) return;

    // إذا مش موجود أيقونة، نضيف واحدة بناءً على حالة المفضلة
    if(!btn.querySelector('i')) {
      if(favs.includes(id)) {
        btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        btn.setAttribute('aria-pressed','true');
        btn.title = 'إزالة من المفضلة';
      } else {
        btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        btn.setAttribute('aria-pressed','false');
        btn.title = 'أضف للمفضلة';
      }
    } else {
      // إذا موجودة، نضبط الكلاس للتوافق
      const icon = btn.querySelector('i');
      if(favs.includes(id)) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        btn.setAttribute('aria-pressed','true');
        btn.title = 'إزالة من المفضلة';
      } else {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
        btn.setAttribute('aria-pressed','false');
        btn.title = 'أضف للمفضلة';
      }
    }

    // نربط الحدث
    btn.onclick = () => toggleFav(id, btn);
  });

  updateCounters();
}

// تهيئة أيقونات المفضلة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  attachFavButtons();
});

// لوحة المفضلة
function renderFavPanel() {
  if(!favList) return;
  if(favs.length===0){
    favList.innerHTML = '<div class="empty-state">لم تضف أي عناصر إلى المفضلة بعد.</div>';
    return;
  }
  favList.innerHTML = '';
  favs.forEach(fid => {
    const p = products.find(x => x.id===fid);
    if(!p) return;
    const div = document.createElement('div');
    div.textContent = p.title;
    favList.appendChild(div);
  });
}


// =====================
// إدارة السلة
// =====================
function renderAddBtns(){
  document.querySelectorAll('.add-btn').forEach(btn=>{
    const id=parseInt(btn.dataset.id);
    btn.onclick=()=>addToCart(id);
  });
}

function addToCart(id){
  const p = products.find(x=>x.id===id);
  if(!p || !p.inStock) return;
  const exist = cart.find(x=>x.id===id);
  if(exist) exist.qty++;
  else cart.push({...p, qty:1});
  saveCart();
  updateCounters();
  renderCartPanel();
}

function renderCartPanel(){
  if(!cartItemsProducts || !cartTotalProducts) return;
  if(cart.length===0){
    cartItemsProducts.innerHTML='<div class="empty-state">السلة فارغة</div>';
    cartTotalProducts.textContent='0 ج.م';
    return;
  }
  cartItemsProducts.innerHTML='';
  let total=0;
  cart.forEach(item=>{
    total+=item.price*item.qty;
    const div=document.createElement('div');
    div.className='cart-item';
    div.innerHTML=`<div>${item.title} × ${item.qty}</div> <div>${item.price*item.qty} ج.م</div>`;
    cartItemsProducts.appendChild(div);
  });
  cartTotalProducts.textContent=total+' ج.م';
}

// =====================
// Quick View
// =====================
function openQuickView(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  qvTitle.textContent=p.title;
  qvImg.src=p.img;
  qvDesc.textContent=p.desc;
  qvPrice.textContent=p.price+' ج.م';
  qvAdd.onclick = ()=>{ addToCart(id); closeQuickView(); };
  qvFav.onclick = ()=>{ toggleFav(id,qvFav); };
  quickView.classList.add('active');
}
function closeQuickView(){ quickView.classList.remove('active'); }
if(qvClose) qvClose.onclick=closeQuickView;

// =====================
// الفلاتر والبحث
// =====================
if(searchInput) searchInput.addEventListener('input',()=>{currentPage=1; renderProducts();});
if(stockFilter) stockFilter.addEventListener('change',()=>{currentPage=1; renderProducts();});
if(sortBySelect) sortBySelect.addEventListener('change',()=>{currentPage=1; renderProducts();});
if(perPageSelect) perPageSelect.addEventListener('change',()=>{
  perPage=parseInt(perPageSelect.value);
  currentPage=1;
  renderProducts();
});

// Pagination
if(paginationPrev) paginationPrev.onclick=()=>{ if(currentPage>1) {currentPage--; renderProducts();} };
if(paginationNext) paginationNext.onclick=()=>{ const totalPages=Math.ceil(products.length/perPage); if(currentPage<totalPages){currentPage++; renderProducts();} };

// فتح/غلق المفضلة والسلة
if(favBtnTop) favBtnTop.onclick=()=>favPanel.classList.toggle('h-hidden');
if(cartBtnTop) cartBtnTop.onclick=()=>cartPanelProducts.classList.toggle('h-hidden') ;

// =====================
// البداية
// =====================
updateCounters();
renderProducts();
renderFavPanel();
renderCartPanel();

// =====================
// ربط زر الدفع في صفحة المنتجات
// =====================
const goToCheckoutBtn = document.getElementById('goToCheckoutProducts');
if(goToCheckoutBtn){
  goToCheckoutBtn.onclick=()=>{
    if(cart.length===0){ alert('السلة فارغة'); return; }
    window.location.href='checkout.html';
  };
}

// init fallback
window.favs = JSON.parse(localStorage.getItem('SHOP_FAV') || '[]');
window.cart = JSON.parse(localStorage.getItem('SHOP_CART') || '[]');

function updateCountersSimple(){
  const cartCountEls = document.querySelectorAll('#cartCountTop, #cartCount, .cart-count');
  const favCountEls = document.querySelectorAll('#favCountTop, #favCount, .fav-count');

  const cartTotal = window.cart.reduce((s,it)=>s + (it.qty||1), 0);
  const favTotal = (window.favs||[]).length;

  cartCountEls.forEach(e=> e.textContent = cartTotal);
  favCountEls.forEach(e=> e.textContent = favTotal);

  console.log('Counters updated -> cart:', cartTotal, 'fav:', favTotal);
}
updateCountersSimple();
