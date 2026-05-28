// nexo™ – CJ Dropshipping Product Search API REAL
// Requiere en Vercel: CJ_API_KEY
// Opcional: CJ_ACCESS_TOKEN y CJ_REFRESH_TOKEN. Si no existen, se genera Access Token automáticamente.

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
let cachedToken = null;
let cachedTokenExpiresAt = 0;

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma','no-cache');
  res.setHeader('Expires','0');
}

async function fetchJson(url, options={}, timeoutMs=15000){
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), timeoutMs);
  try{
    const r = await fetch(url, {...options, signal: ctrl.signal});
    const text = await r.text();
    let data = {};
    try{ data = text ? JSON.parse(text) : {}; }catch(e){ data = {raw:text}; }
    if(!r.ok){
      const err = new Error(data?.message || data?.error || `HTTP ${r.status}`);
      err.status = r.status;
      err.data = data;
      throw err;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function getCjAccessToken(){
  const envToken = (process.env.CJ_ACCESS_TOKEN || '').trim();
  if(envToken) return envToken;

  if(cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;

  const apiKey = (process.env.CJ_API_KEY || '').trim();
  if(!apiKey){
    const err = new Error('Falta CJ_API_KEY en Vercel');
    err.code = 'missing_cj_api_key';
    throw err;
  }

  const data = await fetchJson(`${CJ_BASE}/authentication/getAccessToken`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({apiKey})
  }, 15000);

  const token = data?.data?.accessToken || data?.accessToken || data?.data?.access_token || data?.access_token;
  const expiresIn = Number(data?.data?.expiresIn || data?.expiresIn || 12*60*60);
  if(!token){
    const err = new Error(data?.message || 'CJ no devolvió Access Token');
    err.code = 'cj_token_missing';
    err.data = data;
    throw err;
  }
  cachedToken = token;
  cachedTokenExpiresAt = Date.now() + Math.max(60, expiresIn - 120) * 1000;
  return token;
}

function firstNumber(...vals){
  for(const v of vals){
    if(v === null || v === undefined || v === '') continue;
    if(typeof v === 'string' && v.includes('-')){
      const m = v.match(/[0-9]+(?:\.[0-9]+)?/g);
      if(m && m.length) return Number(m[0]);
    }
    const n = Number(v);
    if(Number.isFinite(n)) return n;
  }
  return 0;
}

function firstString(...vals){
  for(const v of vals){ if(v !== null && v !== undefined && String(v).trim()) return String(v).trim(); }
  return '';
}

function firstImage(raw){
  const img = firstString(raw.productImage, raw.productImageUrl, raw.bigImage, raw.image, raw.imageUrl, raw.thumbnail, raw.productImageSet?.[0]);
  if(img) return img;
  const imgs = raw.productImages || raw.images || raw.productImageList || raw.imageList;
  if(Array.isArray(imgs) && imgs.length){
    const v = imgs[0];
    return typeof v === 'string' ? v : firstString(v.url, v.image, v.imageUrl);
  }
  return '';
}

function normalizeCj(raw, idx){
  const price = firstNumber(raw.sellPrice, raw.price, raw.nowPrice, raw.discountPrice, raw.productPrice, raw.cjProductCost, raw.suggestSellPrice, raw.sellPriceFrom);
  const shipping = firstNumber(raw.shippingCost, raw.shippingPrice, raw.logisticPrice, raw.freightPrice, raw.cjShippingCost);
  const handling = firstNumber(raw.serviceFee, raw.handlingFee, raw.cjHandlingFee, raw.vendorFee);
  const name = firstString(raw.productNameEn, raw.productName, raw.nameEn, raw.name, raw.title, 'CJ Dropshipping product');
  const id = firstString(raw.pid, raw.productId, raw.cjProductId, raw.id, raw.sku, raw.productSku, `cj-${idx+1}`);
  const sourceUrl = firstString(raw.productUrl, raw.sourceUrl, raw.url) || `https://www.cjdropshipping.com/product/${encodeURIComponent(id)}.html`;
  return {
    id: `cj-${String(id).replace(/[^a-zA-Z0-9_-]/g,'_')}`,
    cjProductId: id,
    sku: firstString(raw.sku, raw.productSku, raw.variantSku),
    name,
    title: name,
    price: Number(price.toFixed(2)),
    cjProductCost: Number(price.toFixed(2)),
    cjShippingCost: Number(shipping.toFixed(2)),
    shippingAmazon: Number(shipping.toFixed(2)),
    cjHandlingFee: Number(handling.toFixed(2)),
    vendorFee: Number(handling.toFixed(2)),
    provider: 'CJ Dropshipping',
    proveedor: 'CJ Dropshipping',
    vendor: 'CJ Dropshipping',
    providerLogo: '🇨🇳',
    category: firstString(raw.categoryName, raw.oneCategoryName, raw.twoCategoryName, raw.threeCategoryName, raw.category, 'CJ Dropshipping'),
    image: firstImage(raw),
    sourceUrl,
    url: sourceUrl,
    stock: firstString(raw.inventory, raw.stock, raw.warehouseInventoryNum, raw.totalVerifiedInventory, raw.listedNum, 'Stock real CJ / verificar al confirmar'),
    source: 'cj-dropshipping-api',
    originalCJ: true,
    rawProviderData: raw
  };
}


function translateSearchTerm(q){
  const clean = String(q || '').trim();
  const key = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const map = {
    'cordon':'shoelaces',
    'cordones':'shoelaces',
    'cordones zapatos':'shoelaces',
    'cordones para zapatos':'shoelaces',
    'zapatos':'shoes',
    'zapatillas':'sneakers',
    'tenis':'sneakers',
    'audifonos':'earbuds',
    'auriculares':'earbuds',
    'reloj':'watch',
    'reloj inteligente':'smartwatch',
    'celular':'phone case',
    'telefono':'phone case',
    'funda iphone':'iphone case',
    'cargador':'charger',
    'cable':'usb cable',
    'mochila':'backpack',
    'bolso':'bag',
    'cartera':'handbag',
    'camisa':'shirt',
    'pantalon':'pants',
    'laptop':'laptop',
    'portatil':'laptop',
    'computadora':'laptop',
    'mouse':'mouse',
    'teclado':'keyboard'
  };
  return map[key] || clean;
}

function extractList(data){
  const d = data?.data ?? data;
  if(Array.isArray(d)) return d;
  return d?.list || d?.content || d?.records || d?.products || d?.data || d?.result || [];
}

export default async function handler(req,res){
  cors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'GET') return res.status(405).json({ok:false,error:'Método no permitido'});

  const q = String(req.query.q || req.query.keyWord || req.query.keyword || '').trim();
  const maxPrice = Number(req.query.maxPrice || req.query.max || 0);
  const minPrice = Number(req.query.minPrice || req.query.min || 0);
  const size = Math.min(Math.max(Number(req.query.size || 20), 1), 100);
  const page = Math.max(Number(req.query.page || 1), 1);

  if(!q){
    return res.status(200).json({ok:true, products:[], message:'Ingrese un producto para buscar en CJ Dropshipping'});
  }

  try{
    const token = await getCjAccessToken();
    const translatedQ = translateSearchTerm(q);
    const params = new URLSearchParams({page:String(page), size:String(size), keyWord:translatedQ});
    // CJ API oficial usa startSellPrice/endSellPrice, no minPrice/maxPrice.
    if(Number.isFinite(minPrice) && minPrice > 0) params.set('startSellPrice', String(minPrice));
    if(Number.isFinite(maxPrice) && maxPrice > 0) params.set('endSellPrice', String(maxPrice));
    params.set('features', 'product,category');

    const data = await fetchJson(`${CJ_BASE}/product/listV2?${params.toString()}`, {
      method:'GET',
      headers:{'CJ-Access-Token': token, 'Content-Type':'application/json'}
    }, 20000);

    let products = extractList(data).map(normalizeCj).filter(p => p.price > 0);
    if(Number.isFinite(maxPrice) && maxPrice > 0) products = products.filter(p => p.price <= maxPrice);
    products = products.slice(0, size);

    return res.status(200).json({
      ok:true,
      source:'cj-dropshipping-api',
      query:q,
      cjQuery:translatedQ,
      count:products.length,
      products,
      message: products.length ? 'Productos reales CJ obtenidos correctamente' : 'CJ no devolvió productos para esa búsqueda/presupuesto'
    });
  }catch(err){
    return res.status(err.status || 500).json({
      ok:false,
      status:err.code || 'cj_api_error',
      message:err.message || 'No se pudo consultar CJ Dropshipping',
      setup:['Verificar CJ_API_KEY en Vercel','Redeploy después de crear la variable','Probar /api/cj-products?q=laptop'],
      detail:err.data || null
    });
  }
}
