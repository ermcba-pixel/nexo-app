const AMAZON_SANDBOX_PRODUCTS = [
  ['B0C2W7H8V6','Echo Pop smart speaker','Electronics',39.99,'https://m.media-amazon.com/images/I/61d5F2QEfOL._AC_SL1000_.jpg'],
  ['B09B8V1LZ3','Fire TV Stick HD','Electronics',34.99,'https://m.media-amazon.com/images/I/51TjJOTfslL._AC_SL1000_.jpg'],
  ['B0BFC7WQ6R','Amazon Basics USB-C cable 6 ft','Accessories',9.99,'https://m.media-amazon.com/images/I/61U6oC65TTL._AC_SL1500_.jpg'],
  ['B07FZ8S74R','Amazon Basics AA batteries 48 pack','Office',18.49,'https://m.media-amazon.com/images/I/71IdKRlm8+L._AC_SL1500_.jpg'],
  ['B07YNLBS7R','Logitech wireless mouse','Electronics',14.99,'https://m.media-amazon.com/images/I/61LtuGzXeaL._AC_SL1500_.jpg'],
  ['B08N5WRWNW','Samsung USB-C flash drive 128GB','Electronics',15.99,'https://m.media-amazon.com/images/I/61sCkNqj1PL._AC_SL1500_.jpg'],
  ['B07PXGQC1Q','Acer 23.8 inch Full HD monitor','Electronics',109.99,'https://m.media-amazon.com/images/I/71p-M3sPhhL._AC_SL1500_.jpg'],
  ['B0BSHF7WHW','Anker USB-C charger 47W','Electronics',29.99,'https://m.media-amazon.com/images/I/61x5C2mRDpL._AC_SL1500_.jpg'],
  ['B07W7X24KJ','Amazon Basics laptop sleeve 15.6 inch','Accessories',16.99,'https://m.media-amazon.com/images/I/81mMJZFLY4L._AC_SL1500_.jpg'],
  ['B01N5IB20Q','Amazon Basics notebook pack','Office',12.99,'https://m.media-amazon.com/images/I/81yI2M6ZnTL._AC_SL1500_.jpg'],
  ['B08GYKNCCP','TP-Link WiFi extender','Electronics',19.99,'https://m.media-amazon.com/images/I/51SKmu2G9FL._AC_SL1000_.jpg'],
  ['B07D9C8NP2','Amazon Basics HDMI cable 10 ft','Accessories',8.99,'https://m.media-amazon.com/images/I/71U9BNBgs1L._AC_SL1500_.jpg'],
  ['B0B3C2R8MP','JBL Tune wireless headphones','Electronics',49.95,'https://m.media-amazon.com/images/I/61Bgn7mKjOL._AC_SL1500_.jpg'],
  ['B08H8VZ6PV','HP wireless keyboard and mouse','Electronics',27.99,'https://m.media-amazon.com/images/I/71DU1Q5zIFL._AC_SL1500_.jpg'],
  ['B08X2X5T5W','SanDisk Extreme microSD 128GB','Electronics',13.99,'https://m.media-amazon.com/images/I/71Ue6a6Ns-L._AC_SL1500_.jpg'],
  ['B09V3HN1KC','Kasa smart plug pack','Electronics',24.99,'https://m.media-amazon.com/images/I/61ZeqB3pDUL._AC_SL1500_.jpg'],
  ['B07C2VJXP4','Amazon Basics surge protector','Office',13.99,'https://m.media-amazon.com/images/I/61OCOJ2EFcL._AC_SL1500_.jpg'],
  ['B08D6T5C1D','Ring video doorbell wired','Electronics',64.99,'https://m.media-amazon.com/images/I/61L0G3W1PqL._AC_SL1000_.jpg'],
  ['B07Q45SP9P','Amazon Basics office chair','Office',79.99,'https://m.media-amazon.com/images/I/71fF0XIt78L._AC_SL1500_.jpg'],
  ['B0B1Q2V3N4','Reusable water bottle stainless steel','Home',18.99,'https://m.media-amazon.com/images/I/71wyJctK8LL._AC_SL1500_.jpg']
];

function svgDataUri(title) {
  const safe = String(title || 'Amazon Business').replace(/[<>&]/g, '');
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="100%" height="100%" fill="#f7f7f7"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="42" fill="#232f3e">${safe}</text><text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="30" fill="#ff9900">Amazon Business Sandbox</text></svg>`)}`;
}

function normalize(row, idx) {
  const [asin, title, category, price, image] = row;
  const shipping = Math.max(4.99, +(price * 0.07).toFixed(2));
  return {
    id: `amazon-${asin}`,
    asin,
    name: title,
    title,
    provider: 'Amazon Business',
    proveedor: 'Amazon Business',
    vendor: 'Amazon Business',
    price,
    shippingAmazon: shipping,
    vendorFee: 0,
    category: category.toLowerCase(),
    image: image || svgDataUri(title),
    url: `https://www.amazon.com/dp/${asin}`,
    stock: 10 + (idx % 9),
    source: 'amazon-sp-api-sandbox',
    rating: 4.3 + ((idx % 7) / 10),
    reviews: 120 + idx * 37,
    liveReady: true
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Método no permitido' });

  const q = String(req.query.q || req.query.search || '').trim().toLowerCase();
  const maxPrice = Number(req.query.maxPrice || req.query.max || 0);
  const hasLwa = Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET);

  let products = AMAZON_SANDBOX_PRODUCTS.map(normalize).filter(p => {
    const byText = !q || `${p.name} ${p.category} ${p.asin}`.toLowerCase().includes(q);
    const byPrice = !maxPrice || p.price <= maxPrice;
    return byText && byPrice;
  });

  if (products.length < 20 && !q && !maxPrice) products = AMAZON_SANDBOX_PRODUCTS.map(normalize);

  return res.status(200).json({
    ok: true,
    provider: 'Amazon Business',
    mode: 'sandbox',
    credentialsDetected: hasLwa,
    notice: hasLwa
      ? 'Credenciales LWA detectadas. Sandbox activo. Para producción falta autorizar aplicación y obtener refresh token/IAM Role según Amazon SP-API.'
      : 'Sandbox activo sin credenciales detectadas en Vercel.',
    products
  });
}
