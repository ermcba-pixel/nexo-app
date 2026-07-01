// nexo™ – SHEIN Open Platform utilities
// Variables esperadas en Vercel:
// SHEIN_APP_ID, SHEIN_APP_SECRET_KEY, SHEIN_API_HOST, SHEIN_AUTH_HOST,
// SHEIN_OPEN_KEY_ID, SHEIN_SECRET_KEY, SHEIN_CALLBACK_URL
import crypto from 'crypto';

export const SHEIN_APP_ID = process.env.SHEIN_APP_ID || '15C6DD3A848008B5F87E4C28F4E23';
export const SHEIN_API_HOST = (process.env.SHEIN_API_HOST || 'https://openapi.sheincorp.com').replace(/\/$/, '');
export const SHEIN_AUTH_HOST = (process.env.SHEIN_AUTH_HOST || 'https://openapi-sem.sheincorp.com').replace(/\/$/, '');
export const SHEIN_APP_SECRET_KEY = process.env.SHEIN_APP_SECRET_KEY || process.env.SHEIN_APP_SECRET || '';
export const SHEIN_OPEN_KEY_ID = process.env.SHEIN_OPEN_KEY_ID || process.env.SHEIN_OPENKEYID || '';
export const SHEIN_SECRET_KEY = process.env.SHEIN_SECRET_KEY || process.env.SHEIN_SECRETKEY || '';

export function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store');
}
export function money(...vals){
  for(const v of vals){
    if(v===undefined || v===null || v==='') continue;
    if(typeof v==='object'){
      const nested = money(v.amount, v.price, v.value, v.usd, v.salePrice, v.retailPrice);
      if(nested>0) return nested;
      continue;
    }
    const cleaned = String(v).replace(/[^0-9.,-]/g,'').replace(/,/g,'');
    const n=Number(cleaned);
    if(Number.isFinite(n) && n>0) return Number(n.toFixed(2));
  }
  return 0;
}
export function clean(v){ return String(v||'').trim(); }
export function b64(v){ return Buffer.from(String(v||''), 'utf8').toString('base64'); }
export function nowMs(){ return String(Date.now()); }

export function sha256Hex(s){ return crypto.createHash('sha256').update(String(s),'utf8').digest('hex'); }
export function hmacSha256Hex(secret, s){ return crypto.createHmac('sha256', String(secret||'')).update(String(s),'utf8').digest('hex'); }

export function makeSheinSignature({appId=SHEIN_APP_ID, secret=SHEIN_APP_SECRET_KEY, timestamp=nowMs(), path='', body=''}){
  const mode = String(process.env.SHEIN_SIGNATURE_MODE || 'appid_timestamp_secret').trim();
  let sig;
  if(mode === 'hmac_appid_timestamp_body') sig = hmacSha256Hex(secret, `${appId}${timestamp}${body}`);
  else if(mode === 'hmac_path_body_timestamp') sig = hmacSha256Hex(secret, `${path}${body}${timestamp}`);
  else if(mode === 'appid_secret_timestamp') sig = sha256Hex(`${appId}${secret}${timestamp}`);
  else if(mode === 'secret_appid_timestamp') sig = sha256Hex(`${secret}${appId}${timestamp}`);
  else sig = sha256Hex(`${appId}${timestamp}${secret}`);
  return String(process.env.SHEIN_SIGNATURE_UPPERCASE || '').toLowerCase()==='true' ? sig.toUpperCase() : sig;
}

export function sheinHeaders({secret=SHEIN_APP_SECRET_KEY, path='', body='', openKeyId=''}){
  const timestamp = nowMs();
  const h = {
    'Content-Type':'application/json;charset=UTF-8',
    'language':'en',
    'x-lt-appid': SHEIN_APP_ID,
    'x-lt-timestamp': timestamp,
    'x-lt-signature': makeSheinSignature({secret, timestamp, path, body})
  };
  if(openKeyId) h['x-lt-openKeyId'] = openKeyId;
  return h;
}

export async function sheinPost(path, payload={}, {secret=SHEIN_SECRET_KEY || SHEIN_APP_SECRET_KEY, openKeyId=SHEIN_OPEN_KEY_ID, host=SHEIN_API_HOST}={}){
  const body = JSON.stringify(payload || {});
  const r = await fetch(`${host}${path}`, { method:'POST', headers:sheinHeaders({secret,path,body,openKeyId}), body });
  const text = await r.text();
  let data = null; try{ data = text ? JSON.parse(text) : null; }catch{ data = text; }
  return {ok:r.ok, status:r.status, data, text};
}

export function findFirstArray(obj){
  const seen = new Set();
  function walk(x){
    if(!x || typeof x !== 'object' || seen.has(x)) return null;
    seen.add(x);
    if(Array.isArray(x)){
      if(x.some(i => i && typeof i === 'object')) return x;
      return null;
    }
    const keys = ['list','records','data','items','goodsList','productList','spuList','skuList','content','rows','result'];
    for(const k of keys){ const found = walk(x[k]); if(found) return found; }
    for(const v of Object.values(x)){ const found = walk(v); if(found) return found; }
    return null;
  }
  return walk(obj) || [];
}

function first(...vals){ for(const v of vals){ if(v!==undefined && v!==null && String(v).trim()) return String(v).trim(); } return ''; }
function pickDeep(obj, names){
  const seen = new Set();
  const lower = new Set(names.map(n=>String(n).toLowerCase()));
  function walk(x){
    if(!x || typeof x !== 'object' || seen.has(x)) return '';
    seen.add(x);
    if(Array.isArray(x)){
      for(const it of x){ const y=walk(it); if(y) return y; }
      return '';
    }
    for(const [k,v] of Object.entries(x)){
      if(lower.has(String(k).toLowerCase()) && v!==undefined && v!==null && String(v).trim()) return v;
    }
    for(const v of Object.values(x)){ const y=walk(v); if(y) return y; }
    return '';
  }
  return walk(obj);
}
function pickPrice(obj){
  const v = pickDeep(obj, ['price','salePrice','sale_price','retailPrice','retail_price','suggestedRetailPrice','suggested_retail_price','costPrice','cost_price','skuPrice','shopPrice','supplierPrice','amount','value']);
  return money(v);
}
export function normalizeSheinProduct(row, idx=0){
  const raw = row || {};
  const id = first(raw.spuCode, raw.spu_code, raw.productId, raw.product_id, raw.goodsSn, raw.goodsCode, raw.skuCode, raw.sku_code, raw.id, pickDeep(raw, ['spuCode','productId','goodsSn','goodsCode','skuCode','id']), `shein-${idx}`);
  const sku = first(raw.skuCode, raw.sku_code, raw.supplierSku, raw.supplier_sku, raw.sku, pickDeep(raw, ['skuCode','supplierSku','sku']), id);
  const name = first(raw.title, raw.productName, raw.product_name, raw.goodsName, raw.name, raw.spuName, pickDeep(raw, ['title','productName','goodsName','name','spuName']), 'SHEIN product');
  const price = pickPrice(raw);
  const image = first(raw.imageUrl, raw.image_url, raw.mainImage, raw.main_image, raw.goodsImage, raw.pictureUrl, raw.imgUrl, raw.urlImage, raw.image, pickDeep(raw, ['imageUrl','mainImage','goodsImage','pictureUrl','imgUrl','urlImage','image','thumbnail','coverImage']));
  const url = first(raw.productUrl, raw.product_url, raw.goodsUrl, raw.url, pickDeep(raw, ['productUrl','goodsUrl','url']), '');
  return {
    id:String(id).replace(/[^a-zA-Z0-9_-]/g,'_'), sheinProductId:id, sku,
    name, title:name, provider:'SHEIN', proveedor:'SHEIN', vendor:'SHEIN', providerLogo:'🛍️',
    price, cjProductCost:price,
    category:first(raw.categoryName, raw.category_name, raw.category, raw.catName, pickDeep(raw, ['categoryName','category','catName']), 'SHEIN'),
    brand:first(raw.brandName, raw.brand_name, raw.brand, pickDeep(raw, ['brandName','brand']), 'SHEIN'),
    image, sourceUrl:url, url, originalProviderUrl:url,
    stock:first(raw.stock, raw.inventory, raw.stockQuantity, raw.stock_quantity, pickDeep(raw, ['stock','inventory','stockQuantity']), 'Verificar stock SHEIN'),
    shippingAmazon:0, cjShippingCost:0, vendorFee:0, cjHandlingFee:0,
    source:'shein_open_platform_api', raw
  };
}
