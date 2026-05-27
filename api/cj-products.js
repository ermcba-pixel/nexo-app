// nexo™ · CJ Dropshipping product search endpoint
// Requires Vercel Environment Variable: CJ_API_KEY
// Optional: CJ_ACCESS_TOKEN (used directly if present)

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.end(JSON.stringify(body));
}

async function getAccessToken() {
  if (process.env.CJ_ACCESS_TOKEN) return process.env.CJ_ACCESS_TOKEN;
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) return null;
  const r = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data || data.result === false) {
    throw new Error(data?.message || 'No se pudo obtener CJ Access Token');
  }
  return data?.data?.accessToken || data?.data?.access_token || data?.accessToken;
}

function normalize(item, idx) {
  const price = Number(item.sellPrice || item.nowPrice || item.discountPrice || item.price || 0);
  return {
    id: item.id || item.pid || item.productSku || item.sku || `cj-${idx}`,
    name: item.nameEn || item.productNameEn || item.name || item.productName || 'CJ Dropshipping product',
    sku: item.sku || item.productSku || '',
    price: Number((Number.isFinite(price) ? price : 0).toFixed(2)),
    image: item.bigImage || item.productImage || item.image || '',
    category: item.categoryName || item.oneCategoryName || item.twoCategoryName || item.threeCategoryName || '',
    stock: item.totalVerifiedInventory || item.warehouseInventoryNum || item.inventory || '',
    sourceUrl: item.productUrl || `https://www.cjdropshipping.com/search/${encodeURIComponent(item.nameEn || item.productNameEn || '')}.html`,
    provider: 'CJ Dropshipping'
  };
}

export default async function handler(req, res) {
  try {
    const q = String(req.query.q || '').trim();
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
    const size = Math.min(Math.max(Number(req.query.size || 20), 1), 20);
    if (!q) return json(res, 200, { ok: true, products: [] });

    const token = await getAccessToken();
    if (!token) {
      return json(res, 428, {
        ok: false,
        status: 'CJ_API_KEY_REQUIRED',
        message: 'Falta configurar CJ_API_KEY en Vercel para consultar productos reales de CJ Dropshipping.',
        setup: ['CJ: My CJ → Authorization → API → API Key', 'Vercel: Environment Variables → CJ_API_KEY', 'Redeploy Production']
      });
    }

    const params = new URLSearchParams({ page: '1', size: String(size), keyWord: q, features: 'enable_category' });
    if (Number.isFinite(maxPrice)) params.set('endSellPrice', String(maxPrice));
    const url = `${CJ_BASE}/product/listV2?${params.toString()}`;
    const r = await fetch(url, { headers: { 'CJ-Access-Token': token } });
    const data = await r.json().catch(() => null);
    if (!r.ok || !data || data.result === false) {
      return json(res, 502, { ok: false, status: 'CJ_QUERY_FAILED', message: data?.message || 'CJ API no respondió correctamente', raw: data });
    }

    const content = data?.data?.content || [];
    const rawProducts = Array.isArray(content)
      ? content.flatMap(x => Array.isArray(x.productList) ? x.productList : [x])
      : [];
    const products = rawProducts.map(normalize).filter(p => p.price > 0 && (!Number.isFinite(maxPrice) || p.price <= maxPrice));
    return json(res, 200, { ok: true, source: 'CJ Dropshipping API', products });
  } catch (e) {
    return json(res, 500, { ok: false, status: 'CJ_ENDPOINT_ERROR', message: e.message || String(e) });
  }
}
