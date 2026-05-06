// nexo Amazon catalog bridge - Sandbox-safe
// Nota técnica: las credenciales LWA/SP-API permiten autenticación. El entorno Sandbox de Amazon
// no entrega un catálogo público vivo tipo tienda; por eso este endpoint prioriza Amazon Business,
// elimina catálogos demo multi-proveedor y devuelve un catálogo sandbox coherente para pruebas.

const AMAZON_IMAGE_POOL = [
  'https://m.media-amazon.com/images/I/61d5F2QEfOL._AC_SL1000_.jpg',
  'https://m.media-amazon.com/images/I/51TjJOTfslL._AC_SL1000_.jpg',
  'https://m.media-amazon.com/images/I/61U6oC65TTL._AC_SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71IdKRlm8+L._AC_SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61LtuGzXeaL._AC_SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61sCkNqj1PL._AC_SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71p-M3sPhhL._AC_SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61x5C2mRDpL._AC_SL1500_.jpg',
  'https://m.media-amazon.com/images/I/81mMJZFLY4L._AC_SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71U9BNBgs1L._AC_SL1500_.jpg'
];

const QUERY_CATALOGS = {
  iphone: [
    ['Apple iPhone 15 128GB Unlocked', 699], ['Apple iPhone 15 256GB Unlocked', 799],
    ['Apple iPhone 15 Plus 128GB Unlocked', 799], ['Apple iPhone 15 Pro 128GB Unlocked', 899],
    ['Apple iPhone 15 Pro Max 256GB Unlocked', 1099], ['Apple iPhone 14 128GB Unlocked', 599],
    ['Apple iPhone 14 256GB Unlocked', 699], ['Apple iPhone 14 Plus 128GB Unlocked', 679],
    ['Apple iPhone 14 Pro 128GB Renewed', 749], ['Apple iPhone 14 Pro Max 256GB Renewed', 849],
    ['Apple iPhone 13 128GB Unlocked', 499], ['Apple iPhone 13 256GB Unlocked', 579],
    ['Apple iPhone 13 Mini 128GB Renewed', 429], ['Apple iPhone 13 Pro 128GB Renewed', 579],
    ['Apple iPhone 13 Pro Max 256GB Renewed', 699], ['Apple iPhone SE 64GB Unlocked', 429],
    ['Apple iPhone SE 128GB Unlocked', 479], ['Apple iPhone 12 64GB Unlocked Renewed', 299],
    ['Apple iPhone 12 128GB Unlocked Renewed', 359], ['Apple iPhone 12 Pro 128GB Renewed', 459],
    ['Apple iPhone 11 64GB Unlocked Renewed', 249], ['Apple iPhone XR 64GB Unlocked Renewed', 199]
  ],
  laptop: [
    ['Lenovo IdeaPad 15.6 inch laptop',389], ['HP 14 Ryzen laptop',449], ['Dell Inspiron 15 laptop',529], ['Acer Aspire 5 laptop',319],
    ['ASUS Vivobook 15 laptop',479], ['MacBook Air 13 inch M2',899], ['MacBook Air 15 inch M3',1099], ['Lenovo ThinkPad E16 Business Laptop',799],
    ['HP Pavilion 15 laptop',649], ['Dell Latitude Business Laptop',899], ['Acer Chromebook Plus',299], ['Samsung Galaxy Book4',749],
    ['Microsoft Surface Laptop',999], ['LG Gram 16 laptop',1199], ['ASUS Zenbook 14 OLED',849], ['MSI Modern 14 laptop',499],
    ['HP EliteBook business laptop',1099], ['Dell XPS 13 laptop',1199], ['Lenovo Yoga 7 2-in-1',899], ['Acer Nitro gaming laptop',799]
  ],
  macbook: [
    ['Apple MacBook Air 13 inch M2',899], ['Apple MacBook Air 13 inch M3',999], ['Apple MacBook Air 15 inch M3',1099], ['Apple MacBook Pro 14 inch M3',1599],
    ['Apple MacBook Pro 16 inch M3 Pro',2499], ['MacBook Air M1 Renewed',649], ['MacBook USB-C charger 35W',59], ['MacBook USB-C to MagSafe cable',49],
    ['MacBook sleeve 13 inch',19.99], ['MacBook sleeve 15 inch',22.99], ['MacBook USB-C Hub',39.99], ['Magic Mouse for MacBook',79],
    ['Magic Keyboard for MacBook',99], ['USB-C monitor adapter for MacBook',24.99], ['Laptop stand for MacBook',29.99], ['Screen protector for MacBook',16.99],
    ['USB-C external SSD for MacBook 1TB',89.99], ['Anker charger for MacBook',49.99], ['MacBook privacy filter',39.99], ['MacBook Pro case',25.99]
  ],
  monitor: [
    ['Samsung 27 inch FHD monitor',149], ['LG 27 inch IPS monitor',169], ['Dell 24 inch business monitor',139], ['Acer 23.8 inch Full HD monitor',109],
    ['ASUS 27 inch gaming monitor',199], ['Samsung Odyssey gaming monitor',279], ['LG UltraWide 34 inch monitor',349], ['Dell UltraSharp 27 inch monitor',399],
    ['HP 24 inch monitor',129], ['AOC 24 inch monitor',99], ['BenQ 27 inch monitor',229], ['ViewSonic portable monitor',179],
    ['USB-C portable monitor 15.6 inch',149], ['4K UHD 27 inch monitor',299], ['Curved 32 inch monitor',249], ['Monitor arm desk mount',39],
    ['HDMI cable for monitor',8.99], ['DisplayPort cable for monitor',9.99], ['USB-C monitor adapter',19.99], ['Monitor cleaning kit',12.99]
  ],
  teclado: [
    ['Logitech wireless keyboard',24.99], ['HP wireless keyboard and mouse',27.99], ['Microsoft Bluetooth keyboard',39.99], ['Apple Magic Keyboard',99],
    ['Mechanical keyboard RGB',49.99], ['Keychron mechanical keyboard',89.99], ['Logitech MX Keys keyboard',109.99], ['Dell business keyboard',19.99],
    ['Compact USB-C keyboard',29.99], ['Gaming keyboard mechanical',59.99], ['Ergonomic keyboard',69.99], ['Keyboard and mouse combo',34.99],
    ['Spanish layout keyboard',28.99], ['Portable folding keyboard',35.99], ['Bluetooth keyboard for tablet',26.99], ['Keyboard wrist rest',11.99],
    ['Keyboard cleaning gel',8.99], ['USB keyboard wired',12.99], ['Backlit keyboard',39.99], ['Silent office keyboard',21.99]
  ]
};

const GENERIC = [
  ['Echo Pop smart speaker',39.99], ['Fire TV Stick HD',34.99], ['Amazon Basics USB-C cable 6 ft',9.99], ['Amazon Basics AA batteries 48 pack',18.49],
  ['Logitech wireless mouse',14.99], ['Samsung USB-C flash drive 128GB',15.99], ['Acer 23.8 inch Full HD monitor',109.99], ['Anker USB-C charger 47W',29.99],
  ['Amazon Basics laptop sleeve 15.6 inch',16.99], ['Amazon Basics notebook pack',12.99], ['TP-Link WiFi extender',19.99], ['Amazon Basics HDMI cable 10 ft',8.99],
  ['JBL Tune wireless headphones',49.95], ['HP wireless keyboard and mouse',27.99], ['SanDisk Extreme microSD 128GB',13.99], ['Kasa smart plug pack',24.99],
  ['Amazon Basics surge protector',13.99], ['Ring video doorbell wired',64.99], ['Amazon Basics office chair',79.99], ['Reusable water bottle stainless steel',18.99]
];

function pickCatalog(q) {
  const s = String(q || '').toLowerCase();
  for (const key of Object.keys(QUERY_CATALOGS)) if (s.includes(key)) return QUERY_CATALOGS[key];
  if (s) return Array.from({length: 20}, (_, i) => [`${q} - Amazon Business option ${i + 1}`, +(29 + i * 18.75).toFixed(2)]);
  return GENERIC;
}

function categoryFromName(name) {
  const s = name.toLowerCase();
  if (/iphone|macbook|laptop|monitor|keyboard|teclado|charger|cable|mouse|usb|ssd|speaker|fire tv|echo/.test(s)) return 'electronica';
  if (/case|sleeve|protector|adapter|hub|stand|arm|filter/.test(s)) return 'accesorios';
  if (/chair|notebook|office/.test(s)) return 'oficina';
  return 'electronica';
}

function normalize(row, idx) {
  const [title, price] = row;
  const asin = `SANDBOX${String(idx + 1).padStart(4, '0')}`;
  const shipping = Math.max(4.99, +(Number(price) * 0.07).toFixed(2));
  return {
    id: `amazon-${asin}`,
    asin,
    name: title,
    title,
    provider: 'Amazon Business',
    proveedor: 'Amazon Business',
    vendor: 'Amazon Business',
    providerLogo: '🟠',
    price: Number(price),
    shippingAmazon: shipping,
    vendorFee: 0,
    category: categoryFromName(title),
    image: null, // sandbox: el frontend genera imagen segura sin errores 404
    url: `https://www.amazon.com/s?k=${encodeURIComponent(title)}`,
    sourceUrl: `https://www.amazon.com/s?k=${encodeURIComponent(title)}`,
    stock: 8 + (idx % 18),
    source: 'amazon-business-sandbox',
    rating: +(4.2 + ((idx % 8) / 10)).toFixed(1),
    reviews: 120 + idx * 37,
    liveReady: false,
    sandbox: true
  };
}

async function getLwaAccessToken() {
  const client_id = process.env.AMAZON_CLIENT_ID;
  const client_secret = process.env.AMAZON_CLIENT_SECRET;
  const refresh_token = process.env.AMAZON_REFRESH_TOKEN;
  if (!client_id || !client_secret || !refresh_token) return { ok: false, reason: 'missing_env' };
  try {
    const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token, client_id, client_secret });
    const r = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    if (!r.ok) return { ok: false, status: r.status, reason: 'lwa_rejected' };
    const data = await r.json();
    return { ok: Boolean(data.access_token), expires_in: data.expires_in || null };
  } catch (e) {
    return { ok: false, reason: 'lwa_network_error' };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Método no permitido' });

  const q = String(req.query.q || req.query.search || '').trim();
  const maxPrice = Number(req.query.maxPrice || req.query.max || 0);
  const category = String(req.query.category || '').trim().toLowerCase();
  const token = await getLwaAccessToken();

  const normalizedQuery = q.toLowerCase();
  const isKnownStrictQuery = Object.keys(QUERY_CATALOGS).some(k => normalizedQuery.includes(k));

  let products = pickCatalog(q).map(normalize).filter(p => {
    const byPrice = !maxPrice || Number(p.price) <= maxPrice;
    const byCategory = !category || category === 'todas' || p.category === category;
    const byStrictSearch = !normalizedQuery || !isKnownStrictQuery || String(p.name || '').toLowerCase().includes(Object.keys(QUERY_CATALOGS).find(k => normalizedQuery.includes(k)));
    return byPrice && byCategory && byStrictSearch;
  });

  // Si la búsqueda es conocida (iphone, laptop, etc.), NO mezclar productos genéricos.
  // Si es una búsqueda libre desconocida, completar hasta 20 opciones sandbox coherentes.
  if (products.length < 20 && !maxPrice && !isKnownStrictQuery) {
    const extra = GENERIC.map(normalize).filter(p => !products.some(x => x.name === p.name));
    products = products.concat(extra).slice(0, 20);
  }

  return res.status(200).json({
    ok: true,
    provider: 'Amazon Business',
    mode: 'sandbox',
    credentialsDetected: Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET && process.env.AMAZON_REFRESH_TOKEN),
    lwaTokenOk: token.ok,
    tokenStatus: token.ok ? 'LWA token generado' : token.reason,
    notice: token.ok
      ? 'LWA/refresh token OK. Catálogo sandbox de Amazon Business activo para pruebas. Para catálogo vivo y compra real falta API/roles de producción de Amazon Business Ordering/Product Search.'
      : 'Catálogo sandbox de Amazon Business activo. Revise variables LWA si se requiere validación OAuth.',
    products
  });
}
