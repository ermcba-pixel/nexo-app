// nexo™ · CJ Dropshipping REAL product search endpoint
// Vercel ENV required: CJ_API_KEY
// Optional: CJ_ACCESS_TOKEN (only if you want to pin a token manually)
// This endpoint never returns demo products. If CJ does not respond, it returns a clear error.

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.end(JSON.stringify(body));
}

function pick(obj, keys, fallback = '') {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return fallback;
}

function pickNumber(obj, keys, fallback = 0) {
  for (const k of keys) {
    const raw = obj?.[k];
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return fallback;
}

async function readJsonResponse(r) {
  const txt = await r.text();
  try { return txt ? JSON.parse(txt) : {}; } catch { return { rawText: txt }; }
}

async function getAccessToken() {
  const manual = (process.env.CJ_ACCESS_TOKEN || '').trim();
  if (manual) return manual;

  const apiKey = (process.env.CJ_API_KEY || '').trim();
  if (!apiKey) {
    const err = new Error('Falta CJ_API_KEY en Vercel.');
    err.statusCode = 428;
    throw err;
  }

  const r = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  });
  const data = await readJsonResponse(r);
  if (!r.ok || data?.result === false || data?.code >= 400) {
    const err = new Error(data?.message || data?.msg || 'CJ no entregó Access Token. Revise CJ_API_KEY y autorización API.');
    err.statusCode = r.status || 502;
    err.detail = data;
    throw err;
  }
  const token = data?.data?.accessToken || data?.data?.access_token || data?.accessToken || data?.access_token;
  if (!token) {
    const err = new Error('CJ respondió, pero no devolvió accessToken.');
    err.statusCode = 502;
    err.detail = data;
    throw err;
  }
  return token;
}

function normalizeProduct(item, idx) {
  const name = pick(item, ['productNameEn','productName','nameEn','name','title','productNameSet'], 'CJ Dropshipping product');
  const sku = pick(item, ['pid','productId','id','productSku','sku','vid'], `cj-${idx}`);
  const price = pickNumber(item, ['sellPrice','nowPrice','discountPrice','price','listedPrice','productPrice','variantSellPrice'], 0);
  const shipping = pickNumber(item, ['shippingPrice','shippingCost','logisticPrice','freight','freightPrice','logisticsCost','estimatedShipping','shippingFee'], 0);
  const vendorFee = pickNumber(item, ['serviceFee','platformFee','handlingFee','warehouseFee','vendorFee'], 0);
  const image = pick(item, ['productImage','bigImage','image','imageUrl','productImg','thumbnail','picUrl'], '');
  const category = pick(item, ['categoryName','oneCategoryName','twoCategoryName','threeCategoryName','category'], 'CJ Dropshipping');
  const stock = pick(item, ['totalVerifiedInventory','warehouseInventoryNum','inventory','inventoryNum','stock','stockNum'], 'Verificar stock real en CJ');
  const urlName = encodeURIComponent(String(name || '').replace(/\s+/g, '-'));
  return {
    id: String(sku).replace(/[^a-zA-Z0-9_-]/g, '_'),
    cjProductId: pick(item, ['pid','productId','id'], ''),
    sku: String(sku),
    name: String(name),
    price: Number(price.toFixed(2)),
    cjProductCost: Number(price.toFixed(2)),
    shippingAmazon: Number(shipping.toFixed(2)),
    cjShippingCost: Number(shipping.toFixed(2)),
    vendorFee: Number(vendorFee.toFixed(2)),
    cjHandlingFee: Number(vendorFee.toFixed(2)),
    provider: 'CJ Dropshipping',
    providerLogo: '🇨🇳',
    category,
    stock,
    image,
    sourceUrl: pick(item, ['productUrl','url'], `https://www.cjdropshipping.com/search/${urlName}.html`),
    raw: process.env.NEXO_DEBUG_CJ === 'true' ? item : undefined
  };
}

function extractList(data) {
  const candidates = [
    data?.data?.content,
    data?.data?.list,
    data?.data?.result,
    data?.data?.products,
    data?.data,
    data?.content,
    data?.list
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c.flatMap(x => Array.isArray(x?.productList) ? x.productList : [x]);
  }
  return [];
}

async function cjProductList(token, q, maxPrice, size) {
  const variants = [
    ['keyWord', q],
    ['keyword', q],
    ['productName', q],
    ['productNameEn', q]
  ];
  let last = null;
  for (const [key, value] of variants) {
    const params = new URLSearchParams({ page: '1', size: String(size) });
    params.set(key, value);
    if (Number.isFinite(maxPrice)) params.set('endSellPrice', String(maxPrice));
    const r = await fetch(`${CJ_BASE}/product/listV2?${params.toString()}`, {
      headers: { 'CJ-Access-Token': token },
      cache: 'no-store'
    });
    const data = await readJsonResponse(r);
    last = data;
    const list = extractList(data);
    if (r.ok && data?.result !== false && list.length) return { data, list };
  }
  return { data: last, list: [] };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
    const q = String(req.query.q || req.query.keyword || '').trim();
    const maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== '' ? Number(req.query.maxPrice) : null;
    const size = Math.min(Math.max(Number(req.query.size || 20), 1), 50);
    if (!q) return json(res, 200, { ok: true, source: 'CJ Dropshipping API', products: [] });

    const token = await getAccessToken();
    const { data, list } = await cjProductList(token, q, maxPrice, size);
    let products = list.map(normalizeProduct).filter(p => p.price > 0);
    if (Number.isFinite(maxPrice)) products = products.filter(p => p.price <= maxPrice);

    return json(res, 200, {
      ok: true,
      source: 'CJ Dropshipping API',
      real: true,
      query: q,
      count: products.length,
      products,
      message: products.length ? 'Productos reales CJ obtenidos correctamente.' : 'CJ no devolvió productos para esa búsqueda. Pruebe otra palabra en inglés o sin filtro de precio.'
    });
  } catch (e) {
    return json(res, e.statusCode || 500, {
      ok: false,
      real: false,
      status: e.statusCode === 428 ? 'CJ_API_KEY_REQUIRED' : 'CJ_ENDPOINT_ERROR',
      message: e.message || String(e),
      detail: e.detail || null,
      setup: ['Vercel: CJ_API_KEY debe estar en Production and Preview', 'CJ: Aplicaciones → API debe aparecer Autorizado', 'Hacer redeploy en Vercel después de guardar variables']
    });
  }
}
