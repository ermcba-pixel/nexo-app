// nexo – Alibaba Product API
// Usa Alibaba Open Platform real cuando existen token y product IDs.
// No genera productos simulados. Si falta búsqueda/listado en Alibaba, devuelve aviso claro y enlace de sourcing.

const ALIBABA_API_BASE = process.env.ALIBABA_API_BASE || 'https://openapi.alibaba.com';
const ALIBABA_PRODUCT_GET_PATH = process.env.ALIBABA_PRODUCT_GET_PATH || '/icbu/product/get';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
}
function clean(v){ return String(v || '').trim(); }
function money(v){
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
  const key = String(q || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
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
function productIdsFromRequest(req){
  const direct = clean(req.query.productId || req.query.productIds || req.query.alibabaProductIds);
  const env = clean(process.env.ALIBABA_PRODUCT_IDS || '');
  return [...new Set(`${direct},${env}`.split(',').map(x=>x.trim()).filter(Boolean))];
}
function alibabaSearchUrl(q){
  return 'https://www.alibaba.com/trade/search?SearchText=' + encodeURIComponent(translate(q));
}
function pickImage(product){
  const main = product?.main_image || product?.mainImage || product?.main_image_url;
  if(typeof main === 'string') return main;
  if(Array.isArray(main?.images) && main.images.length) return main.images[0];
  if(Array.isArray(product?.images) && product.images.length) return product.images[0];
  if(Array.isArray(product?.image_urls) && product.image_urls.length) return product.image_urls[0];
  return '';
}
function pickPrice(product){
  const wholesale = product?.wholesale_trade || product?.wholesaleTrade || {};
  const candidates = [
    wholesale.price,
    wholesale.min_price,
    wholesale.max_price,
    product?.price,
    product?.min_price,
    product?.product_price
  ];
  for(const c of candidates){
    const n = money(c);
    if(n > 0) return n;
  }
  return 0;
}
function normalizeAlibabaProduct(raw, idx, fallbackQuery){
  const product = typeof raw?.product === 'string' ? JSON.parse(raw.product || '{}') : (raw?.product || raw || {});
  const id = product.product_id || product.productId || product.id || product.encrypt_product_id || product.encryptedProductId || `alibaba-${idx+1}`;
  const name = product.subject || product.title || product.name || product.product_name || `Alibaba ${translate(fallbackQuery)}`;
  const price = pickPrice(product);
  const url = product.detail_url || product.pc_detail_url || product.product_url || alibabaSearchUrl(name || fallbackQuery);
  const moq = product?.wholesale_trade?.batch_number || product?.wholesaleTrade?.batchNumber || product?.moq || product?.min_order_quantity || '';
  const weight = product?.wholesale_trade?.weight || product?.weight || '';
  return {
    id:`alibaba-${id}`,
    sku:`ALI-${String(id).replace(/[^a-z0-9]/gi,'').slice(0,24)}`,
    name, title:name,
    price,
    category:'Alibaba',
    provider:'Alibaba', proveedor:'Alibaba', vendor:'Alibaba', providerLogo:'🇨🇳',
    stock: moq ? `MOQ ${moq}` : 'Verificar MOQ, stock y envío con Alibaba',
    shippingAmazon:0, cjShippingCost:0, vendorFee:0, cjHandlingFee:0,
    sourceUrl:url, url, originalProviderUrl:url,
    image:pickImage(product),
    features:`Producto obtenido por Alibaba Open Platform. ${moq ? `MOQ: ${moq}. ` : ''}${weight ? `Peso: ${weight}. ` : ''}Verificar flete internacional antes de comprar.`,
    source:'alibaba-open-platform',
    moneda:'USD',
    moq,
    sandbox:false,
    originalAlibaba:true
  };
}
async function callAlibabaProductGet(productId, accessToken){
  const url = new URL(ALIBABA_PRODUCT_GET_PATH, ALIBABA_API_BASE);
  const body = new URLSearchParams();
  body.set('app_key', process.env.ALIBABA_APP_KEY || '');
  body.set('access_token', accessToken || '');
  body.set('product_get_request', JSON.stringify({productId:String(productId)}));
  const r = await fetch(url.toString(), {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body
  });
  const text = await r.text();
  let data;
  try{ data = JSON.parse(text); }catch{ data = {raw:text}; }
  if(!r.ok || data?.code || data?.error_code || data?.error){
    return {ok:false, status:r.status, productId, data};
  }
  return {ok:true, status:r.status, productId, data};
}

export default async function handler(req,res){
  cors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'GET') return res.status(405).json({ok:false,error:'Método no permitido'});

  const q = clean(req.query.q || req.query.keyword || req.query.search || '');
  const maxPrice = parseMax(req.query.maxPrice || req.query.max || 0);
  const size = Math.min(Math.max(Number(req.query.size || 20),1),50);
  const accessToken = clean(req.query.accessToken || process.env.ALIBABA_ACCESS_TOKEN || process.env.ALIBABA_TOKEN || '');
  const productIds = productIdsFromRequest(req).slice(0,size);

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

  if(!accessToken || productIds.length === 0){
    return res.status(200).json({
      ok:true,
      provider:'Alibaba',
      mode:'open_platform_ready_waiting_product_ids',
      products:[],
      count:0,
      searchUrl:alibabaSearchUrl(q),
      appKeyConfigured:true,
      appSecretConfigured:true,
      needs:['ALIBABA_ACCESS_TOKEN', 'ALIBABA_PRODUCT_IDS o productIds en la URL'],
      message:'Alibaba está listo, pero /icbu/product/get requiere access token y productId cifrado. No se muestran rellenos ni simuladores.'
    });
  }

  const calls = await Promise.allSettled(productIds.map(id=>callAlibabaProductGet(id, accessToken)));
  const errors=[];
  let products=[];
  for(const c of calls){
    if(c.status !== 'fulfilled'){ errors.push(String(c.reason)); continue; }
    if(!c.value.ok){ errors.push(c.value); continue; }
    try{ products.push(normalizeAlibabaProduct(c.value.data, products.length, q)); }
    catch(e){ errors.push({productId:c.value.productId, error:String(e.message||e)}); }
  }
  products = products.filter(p=>p.price>0);
  if(maxPrice>0) products = products.filter(p=>p.price<=maxPrice);
  products = products.sort((a,b)=>money(a.price)-money(b.price)).slice(0,size);

  return res.status(200).json({
    ok:true,
    provider:'Alibaba',
    mode:'open_platform_product_get',
    endpoint:ALIBABA_PRODUCT_GET_PATH,
    count:products.length,
    sort:'price_asc',
    products,
    errors:errors.slice(0,5),
    searchUrl:alibabaSearchUrl(q),
    message: products.length ? 'Alibaba devuelve productos reales desde Open Platform.' : 'Alibaba respondió, pero no devolvió productos con precio válido. Revisar token, productId cifrado y permiso del endpoint.'
  });
}
