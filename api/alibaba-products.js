// nexo – Alibaba Product API REAL
// Usa Alibaba Open Platform con /alibaba/icbu/product/list para buscar por nombre.
// No usa ALIBABA_PRODUCT_IDS y no genera productos simulados.

const ALIBABA_API_BASE = process.env.ALIBABA_API_BASE || 'https://openapi.alibaba.com';
const ALIBABA_PRODUCT_LIST_PATH = process.env.ALIBABA_PRODUCT_LIST_PATH || '/alibaba/icbu/product/list';
const ALIBABA_PRODUCT_GET_PATH = process.env.ALIBABA_PRODUCT_GET_PATH || '/icbu/product/get';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
}
function clean(v){ return String(v || '').trim(); }
function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
function money(v){
  if(v && typeof v === 'object'){
    const candidates=[v.amount,v.value,v.price,v.min_price,v.max_price,v.cent,v.dollar,v.usd];
    for(const c of candidates){ const n=money(c); if(n>0) return n; }
  }
  const n = Number(String(v ?? '').replace(/[^0-9.\-]/g,''));
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}
function parseMax(v){
  const raw = String(v ?? '').trim();
  if(!raw) return 0;
  const nums = raw.match(/[0-9]+(?:\.[0-9]+)?/g);
  if(nums?.length) return Math.max(...nums.map(Number).filter(Number.isFinite));
  return money(raw);
}
function translate(q){
  const key = norm(q);
  const map = {
    'calcetin':'socks','calcetines':'socks','medias':'socks','media':'socks',
    'cordon':'shoelaces','cordones':'shoelaces','cordones zapatos':'shoelaces','cordones para zapatos':'shoelaces',
    'zapato':'shoes','zapatos':'shoes','zapatillas':'sneakers','tenis':'sneakers',
    'audifonos':'earbuds','auriculares':'earbuds','reloj':'watch','reloj inteligente':'smartwatch',
    'celular':'phone','telefono':'phone','cargador':'charger','cable':'usb cable',
    'camisa':'shirt','pantalon':'pants','mochila':'backpack','bolso':'bag','cartera':'handbag',
    'laptop':'laptop','computadora':'computer','mouse':'mouse','teclado':'keyboard'
  };
  return map[key] || q || 'product';
}
function alibabaSearchUrl(q){
  return 'https://www.alibaba.com/trade/search?SearchText=' + encodeURIComponent(translate(q));
}
function safeJsonParse(v){
  if(typeof v !== 'string') return v;
  try{ return JSON.parse(v); }catch{ return v; }
}
function pickImage(product){
  const main = product?.main_image || product?.mainImage || product?.main_image_url || product?.mainImageUrl;
  if(typeof main === 'string') return main;
  if(Array.isArray(main?.images) && main.images.length) return main.images[0];
  if(Array.isArray(product?.images) && product.images.length) return product.images[0];
  if(Array.isArray(product?.image_urls) && product.image_urls.length) return product.image_urls[0];
  if(Array.isArray(product?.imageUrls) && product.imageUrls.length) return product.imageUrls[0];
  return '';
}
function pickPrice(product){
  const wholesale = product?.wholesale_trade || product?.wholesaleTrade || {};
  const priceInfo = product?.price_info || product?.priceInfo || {};
  const candidates = [
    wholesale.price, wholesale.min_price, wholesale.max_price, wholesale.minPrice, wholesale.maxPrice,
    priceInfo.price, priceInfo.min_price, priceInfo.max_price, priceInfo.minPrice, priceInfo.maxPrice,
    product?.price, product?.min_price, product?.max_price, product?.product_price, product?.productPrice
  ];
  for(const c of candidates){ const n = money(c); if(n > 0) return n; }
  return 0;
}
function unwrapProduct(raw){
  let x = safeJsonParse(raw);
  if(x?.product) x = safeJsonParse(x.product);
  if(x?.result?.product) x = safeJsonParse(x.result.product);
  if(x?.result && !x.subject && !x.id && !x.product_id) x = x.result;
  return x || {};
}
function normalizeAlibabaProduct(raw, idx, fallbackQuery){
  const product = unwrapProduct(raw);
  const id = product.product_id || product.productId || product.id || product.encrypt_product_id || product.encryptedProductId || product.offer_id || `alibaba-${idx+1}`;
  const name = product.subject || product.title || product.name || product.product_name || `Alibaba ${translate(fallbackQuery)}`;
  const price = pickPrice(product);
  const url = product.detail_url || product.pc_detail_url || product.product_url || product.detailUrl || product.pcDetailUrl || product.productUrl || alibabaSearchUrl(name || fallbackQuery);
  const moq = product?.wholesale_trade?.batch_number || product?.wholesaleTrade?.batchNumber || product?.moq || product?.min_order_quantity || '';
  const weight = product?.wholesale_trade?.weight || product?.weight || '';
  const owner = product.owner_member_display_name || product.ownerMemberDisplayName || product.supplier_name || product.supplierName || '';
  return {
    id:`alibaba-${String(id).replace(/[^a-zA-Z0-9_-]/g,'_')}`,
    alibabaProductId:String(id),
    sku:`ALI-${String(id).replace(/[^a-z0-9]/gi,'').slice(0,24)}`,
    name, title:name,
    price,
    category:'Alibaba',
    provider:'Alibaba', proveedor:'Alibaba', vendor:'Alibaba', providerLogo:'🇨🇳',
    stock: moq ? `MOQ ${moq}` : 'Verificar MOQ, stock y envío con Alibaba',
    shippingAmazon:0, cjShippingCost:0, vendorFee:0, cjHandlingFee:0,
    sourceUrl:url, url, originalProviderUrl:url,
    image:pickImage(product),
    features:`Producto real de Alibaba Open Platform. ${owner ? `Proveedor: ${owner}. ` : ''}${moq ? `MOQ: ${moq}. ` : ''}${weight ? `Peso: ${weight}. ` : ''}Verificar flete internacional antes de comprar.`,
    source:'alibaba-open-platform-list',
    moneda:'USD',
    moq,
    sandbox:false,
    originalAlibaba:true
  };
}
function extractListProducts(data){
  const d = safeJsonParse(data);
  const r = d?.result || d?.data || d;
  const candidates = [
    r?.products,
    r?.product_list,
    r?.productList,
    r?.items,
    r?.list,
    d?.products,
    d?.product_list,
    d?.productList
  ];
  for(const c of candidates){ if(Array.isArray(c)) return c; }
  if(r?.product && Array.isArray(r.product)) return r.product;
  return [];
}
function apiError(data){
  const d = safeJsonParse(data) || {};
  return d.error || d.error_msg || d.error_message || d.errorMsg || d.error_code || d.code || d?.result?.error_msg || d?.result?.error_code || null;
}
async function callAlibaba(path, params, accessToken){
  const url = new URL(path, ALIBABA_API_BASE);
  const common = {
    app_key: process.env.ALIBABA_APP_KEY || '',
    access_token: accessToken || '',
    ...params
  };
  const body = new URLSearchParams();
  Object.entries(common).forEach(([k,v])=>{ if(v !== undefined && v !== null && String(v) !== '') body.set(k, String(v)); });

  const attempts = [];
  // Intento principal: POST form al path de la documentación.
  attempts.push(fetch(url.toString(), {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body}));
  // Respaldo: GET con querystring, útil en el API testing tool.
  const getUrl = new URL(path, ALIBABA_API_BASE);
  for(const [k,v] of body.entries()) getUrl.searchParams.set(k,v);
  attempts.push(fetch(getUrl.toString(), {method:'GET'}));

  let last = null;
  for(const p of attempts){
    const r = await p.catch(e=>({ok:false,status:0,text:async()=>String(e.message||e)}));
    const text = await r.text();
    let data; try{ data = JSON.parse(text); }catch{ data = {raw:text}; }
    last = {ok:r.ok, status:r.status, data};
    if(r.ok && !apiError(data)) return last;
  }
  return last || {ok:false,status:0,data:{error:'no_response'}};
}
async function callAlibabaProductList({q, size, accessToken}){
  const subject = translate(q);
  return callAlibaba(ALIBABA_PRODUCT_LIST_PATH, {
    current_page: '1',
    page_size: String(Math.min(Math.max(Number(size || 20),1),30)),
    subject
  }, accessToken);
}
async function callAlibabaProductGet(productId, accessToken){
  return callAlibaba(ALIBABA_PRODUCT_GET_PATH, {
    product_get_request: JSON.stringify({productId:String(productId)})
  }, accessToken);
}

export default async function handler(req,res){
  cors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'GET') return res.status(405).json({ok:false,error:'Método no permitido'});

  const q = clean(req.query.q || req.query.keyword || req.query.search || '');
  const maxPrice = parseMax(req.query.maxPrice || req.query.max || 0);
  const size = Math.min(Math.max(Number(req.query.size || 20),1),30);
  const accessToken = clean(req.query.accessToken || process.env.ALIBABA_ACCESS_TOKEN || process.env.ALIBABA_TOKEN || '');

  if(!process.env.ALIBABA_APP_KEY || !process.env.ALIBABA_APP_SECRET){
    return res.status(200).json({
      ok:false,
      provider:'Alibaba',
      mode:'missing_credentials',
      products:[],
      searchUrl:alibabaSearchUrl(q),
      message:'Faltan ALIBABA_APP_KEY y/o ALIBABA_APP_SECRET en Vercel. No se generan productos simulados.'
    });
  }
  if(!accessToken){
    return res.status(200).json({
      ok:false,
      provider:'Alibaba',
      mode:'missing_access_token',
      products:[],
      searchUrl:alibabaSearchUrl(q),
      message:'Falta ALIBABA_ACCESS_TOKEN en Vercel. No se generan productos simulados.'
    });
  }

  const listCall = await callAlibabaProductList({q, size, accessToken});
  const rawList = extractListProducts(listCall.data);
  const listProducts = rawList.map((p,i)=>normalizeAlibabaProduct(p,i,q));

  // Si el listado no trae precio, intenta ampliar detalle con /icbu/product/get para los primeros productos.
  let products = listProducts;
  const needsDetail = products.some(p=>!p.price) && rawList.length;
  const detailErrors = [];
  if(needsDetail){
    const ids = products.map(p=>p.alibabaProductId).filter(Boolean).slice(0, Math.min(size, 12));
    const detailCalls = await Promise.allSettled(ids.map(id=>callAlibabaProductGet(id, accessToken)));
    const detailed = [];
    for(const c of detailCalls){
      if(c.status !== 'fulfilled'){ detailErrors.push(String(c.reason)); continue; }
      if(!c.value.ok || apiError(c.value.data)){ detailErrors.push(c.value.data); continue; }
      try{ detailed.push(normalizeAlibabaProduct(c.value.data, detailed.length, q)); }
      catch(e){ detailErrors.push(String(e.message||e)); }
    }
    if(detailed.length) products = detailed;
  }

  products = products.filter(p=>p.price>0);
  if(maxPrice>0) products = products.filter(p=>p.price<=maxPrice);
  products = products.sort((a,b)=>money(a.price)-money(b.price)).slice(0,size);

  return res.status(200).json({
    ok:true,
    provider:'Alibaba',
    mode:'open_platform_product_list',
    endpoint:ALIBABA_PRODUCT_LIST_PATH,
    detailEndpoint:ALIBABA_PRODUCT_GET_PATH,
    count:products.length,
    sort:'price_asc',
    products,
    searchUrl:alibabaSearchUrl(q),
    debug: req.query.debug ? {listStatus:listCall.status, listError:apiError(listCall.data), rawCount:rawList.length, detailErrors:detailErrors.slice(0,3), sample:listCall.data} : undefined,
    message: products.length ? 'Alibaba devuelve productos reales desde /alibaba/icbu/product/list.' : 'Alibaba respondió sin productos con precio válido. Probar /api/alibaba-products?q=zapatos&debug=1 y revisar listError/rawCount.'
  });
}
