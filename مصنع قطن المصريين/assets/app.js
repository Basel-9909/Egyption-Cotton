const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const app = $('#app');
const detailView = $('#product-view');
let products = [];
let activeFilter = 'all';
let cart = JSON.parse(localStorage.getItem('ecf-cart') || '[]');
let toastTimer;

const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => `${Number(n).toLocaleString('ar-EG')} ج.م`;
const imageUrl = item => item?.image || 'assets/products/adult-01.jpeg';
const allColors = product => product.audience === 'kids' ? Object.values(product.ages).flat() : product.colors;
const productPrice = product => product.audience === 'kids' ? money(product.price) : 'السعر عند التواصل';
function showToast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2300)}
function saveCart(){localStorage.setItem('ecf-cart',JSON.stringify(cart));renderCart()}
function setHash(hash){location.hash=hash}
function productById(id){return products.find(p=>p.id===id)}

function renderGrid(){
  const query=($('#search')?.value||'').trim().toLocaleLowerCase('ar');
  const shown=products.filter(p=>(activeFilter==='all'||p.audience===activeFilter)&&(!query||`${p.title} ${p.category}`.toLocaleLowerCase('ar').includes(query)));
  $('#all-count').textContent=products.length;
  $('#product-grid').innerHTML=shown.length?shown.map(p=>{
    const colors=allColors(p);const cover=colors[0];
    return `<article class="product-card">
      <a class="product-image" href="#product/${encodeURIComponent(p.id)}" aria-label="عرض ${escapeHtml(p.title)}"><img loading="lazy" src="${imageUrl(cover)}" alt="${escapeHtml(p.title)} - ${escapeHtml(cover?.color||'')}"/><span class="product-badge">${p.audience==='kids'?'الأطفال':'قطن مصري'}</span></a>
      <button class="quick-add" data-quick="${p.id}">عرض التفاصيل +</button>
      <div class="product-meta"><div class="product-type"><h3>${escapeHtml(p.title)}</h3><span>${escapeHtml(p.audience==='kids'?'KIDS':'ECF')}</span></div><div class="product-desc"><span>${p.audience==='kids'?'طقم قطعتين':'تصميم قطني'}</span><span>${productPrice(p)}</span></div>
      <div class="swatch-row">${colors.slice(0,6).map((c,i)=>`<button class="swatch-mini" title="${escapeHtml(c.color)}" aria-label="${escapeHtml(c.color)}" data-card-color="${p.id}" data-index="${i}" style="background-image:url('${imageUrl(c)}')"></button>`).join('')}${colors.length>6?`<span class="more-colors">+${colors.length-6}</span>`:''}</div></div>
    </article>`
  }).join(''):'<div class="empty-state">مفيش منتجات مطابقة لبحثك.</div>';
}

function renderProduct(id){
  const p=productById(decodeURIComponent(id||''));if(!p){app.innerHTML='<section class="detail-page"><p>المنتج غير موجود.</p><a class="text-link" href="#shop">العودة للتشكيلة ←</a></section>';return}
  const age=p.audience==='kids'?'6':null;let colors=p.audience==='kids'?p.ages[age]:p.colors;
  detailView.innerHTML=`<section class="detail-page"><div class="breadcrumbs"><a href="#home">الرئيسية</a>　/　<a href="#shop">التشكيلة</a>　/　${escapeHtml(p.title)}</div>
    <div class="detail-layout"><div class="detail-gallery"><img class="detail-main-image" id="detail-image" src="${imageUrl(colors[0])}" alt="${escapeHtml(p.title)}"></div>
      <div class="detail-info"><span class="detail-kicker">${p.audience==='kids'?'تشكيلة الأطفال':'تشكيلة الكبار'} · EGYPTIAN COTTON FACTORY</span><h1 class="detail-title">${escapeHtml(p.title)}</h1><div class="detail-price">${productPrice(p)}</div>
      <p class="detail-description">قطعة قطنية بتصميم عملي ومريح للاستخدام اليومي. اختار اللون والمقاس المناسب، وأضفها لسلتك.</p>
      ${p.audience==='kids'?`<div class="option-label"><span>العمر</span><small>اختار الفئة العمرية</small></div><div class="size-row age-row">${Object.keys(p.ages).map((a,i)=>`<button class="size-option ${i===0?'selected':''}" data-age="${a}">${a} سنوات</button>`).join('')}</div><div class="kids-age-info" id="kids-age-note">السعر للطقم: 600 جنيه</div>`:`<div class="option-label"><span>المقاس</span><small>مقاسات ثابتة لكل القطع</small></div><div class="size-row">${['L','XL','XXL'].map((s,i)=>`<button class="size-option ${i===0?'selected':''}" data-size="${s}">${s}</button>`).join('')}</div>`}
      <div class="option-label"><span>اللون</span><small id="selected-color-label">${escapeHtml(colors[0]?.color||'')}</small></div><div class="color-bar" id="color-bar">${colors.map((c,i)=>`<button class="swatch ${i===0?'selected':''}" data-color-index="${i}" title="${escapeHtml(c.color)}" aria-label="${escapeHtml(c.color)}" style="background-image:url('${imageUrl(c)}')"></button>`).join('')}</div>
      <div class="detail-actions"><button class="add-button" id="add-to-cart">أضف إلى السلة</button><a class="call-button" href="tel:01004206146">استفسر عن المنتج</a></div><div class="detail-delivery"><span>↗</span><div><b>التوصيل داخل مصر</b><br>تكلفة التوصيل يتم تأكيدها عند التواصل.</div></div>
      </div></div></section>`;
  let chosen=colors[0],chosenSize=p.audience==='kids'?'6 سنوات':'L';
  const updateImage=(color,index)=>{chosen=color;$('#detail-image').src=imageUrl(color);$('#selected-color-label').textContent=color.color;$('#color-bar').querySelectorAll('.swatch').forEach((el,i)=>el.classList.toggle('selected',i===index))};
  $('#color-bar').addEventListener('click',e=>{const b=e.target.closest('[data-color-index]');if(b)updateImage(colors[Number(b.dataset.colorIndex)],Number(b.dataset.colorIndex))});
  if(p.audience==='kids'){$('.age-row').addEventListener('click',e=>{const b=e.target.closest('[data-age]');if(!b)return;$('.age-row').querySelectorAll('.size-option').forEach(x=>x.classList.toggle('selected',x===b));const a=b.dataset.age;chosenSize=`${a} سنوات`;colors=p.ages[a];$('#color-bar').innerHTML=colors.map((c,i)=>`<button class="swatch ${i===0?'selected':''}" data-color-index="${i}" title="${escapeHtml(c.color)}" aria-label="${escapeHtml(c.color)}" style="background-image:url('${imageUrl(c)}')"></button>`).join('');updateImage(colors[0],0);});}
  else{$$('.size-option').forEach(b=>b.addEventListener('click',()=>{$$('.size-option').forEach(x=>x.classList.toggle('selected',x===b));chosenSize=b.dataset.size}))}
  $('#add-to-cart').addEventListener('click',()=>{cart.push({id:p.id,title:p.title,size:chosenSize,color:chosen.color,image:imageUrl(chosen),price:p.audience==='kids'?p.price:null});saveCart();showToast('اتضاف المنتج لسلة المشتريات');openCart()});
}

function route(){const match=location.hash.match(/^#product\/(.+)$/);if(match){app.hidden=true;detailView.hidden=false;renderProduct(match[1]);window.scrollTo(0,0)}else{detailView.hidden=true;app.hidden=false;if(location.hash.includes('category=kids')){activeFilter='kids';$('.filter-tabs')?.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x.dataset.filter==='kids'))}renderGrid();if(location.hash==='#shop'||location.hash.startsWith('#shop?'))setTimeout(()=>$('#shop')?.scrollIntoView({behavior:'smooth'}),30)}}
function openCart(){ $('#cart-drawer').classList.add('open');$('#overlay').classList.add('show');$('#cart-drawer').setAttribute('aria-hidden','false') }
function closeCart(){ $('#cart-drawer').classList.remove('open');$('#overlay').classList.remove('show');$('#cart-drawer').setAttribute('aria-hidden','true') }
function renderCart(){
  $('#cart-count').textContent=cart.length;const known=cart.reduce((n,item)=>n+(item.price||0),0);$('#cart-total').textContent=money(known);
  $('#cart-items').innerHTML=cart.length?cart.map((item,i)=>`<div class="cart-line"><img src="${imageUrl(item)}" alt=""><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.color)} · ${escapeHtml(item.size)}</p><strong>${item.price?money(item.price):'السعر عند التواصل'}</strong></div><button data-remove="${i}" aria-label="حذف المنتج">×</button></div>`).join(''):'<div class="cart-empty">السلة لسه فاضية.<br>اختار قطعة من التشكيلة وابدأ تسوق.</div>';
}

function start(){products=window.ECF_PRODUCTS||[];if(!products.length){$('#product-grid').innerHTML='<div class="empty-state">حصلت مشكلة في تحميل التشكيلة.</div>';return}route();renderCart();}
window.addEventListener('hashchange',route);
$('.filter-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;activeFilter=b.dataset.filter;$('.filter-tabs').querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));renderGrid()});
$('#search').addEventListener('input',renderGrid);
$('#product-grid').addEventListener('click',e=>{const q=e.target.closest('[data-quick]');if(q)setHash(`product/${q.dataset.quick}`);const sw=e.target.closest('[data-card-color]');if(sw){const product=productById(sw.dataset.cardColor);const color=allColors(product)[Number(sw.dataset.index)];const card=sw.closest('.product-card');$('.product-image img',card).src=imageUrl(color);}});
$('#cart-open').addEventListener('click',openCart);$('#cart-close').addEventListener('click',closeCart);$('#overlay').addEventListener('click',closeCart);
$('#cart-items').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){cart.splice(Number(b.dataset.remove),1);saveCart()}});
$('#menu-toggle').addEventListener('click',()=>$('.main-nav').classList.toggle('open'));
start();
