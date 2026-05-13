
// nexo Amazon Business bridge
// Sandbox usa catálogo controlado. Producción usará imágenes originales Amazon si el API devuelve URLs válidas.

const QUERY_CATALOGS = {
  iphone: [
    ['Apple iPhone 15 Pro Max 256GB Unlocked', 1099, 'phone'],
    ['Apple iPhone 15 Pro 128GB Unlocked', 899, 'phone'],
    ['Apple iPhone 14 Pro Max 256GB Renewed', 849, 'phone'],
    ['Apple iPhone 15 256GB Unlocked', 799, 'phone'],
    ['Apple iPhone 15 Plus 128GB Unlocked', 799, 'phone'],
    ['Apple iPhone 14 Pro 128GB Renewed', 749, 'phone'],
    ['Apple iPhone 15 128GB Unlocked', 699, 'phone'],
    ['Apple iPhone 14 256GB Unlocked', 699, 'phone'],
    ['Apple iPhone 13 Pro Max 256GB Renewed', 699, 'phone'],
    ['Apple iPhone 14 Plus 128GB Unlocked', 679, 'phone'],
    ['Apple iPhone 14 128GB Unlocked', 599, 'phone'],
    ['Apple iPhone 13 256GB Unlocked', 579, 'phone'],
    ['Apple iPhone 13 Pro 128GB Renewed', 579, 'phone'],
    ['Apple iPhone 13 128GB Unlocked', 499, 'phone'],
    ['Apple iPhone SE 128GB Unlocked', 479, 'phone'],
    ['Apple iPhone 12 Pro 128GB Renewed', 459, 'phone'],
    ['Apple iPhone SE 64GB Unlocked', 429, 'phone'],
    ['Apple iPhone 12 128GB Unlocked Renewed', 359, 'phone'],
    ['Apple iPhone 12 64GB Unlocked Renewed', 299, 'phone'],
    ['Apple iPhone 11 64GB Unlocked Renewed', 249, 'phone']
  ],
  laptop: [
    ['LG Gram 16 laptop',1199,'laptop'], ['Dell XPS 13 laptop',1199,'laptop'], ['HP EliteBook business laptop',1099,'laptop'],
    ['MacBook Air 15 inch M3',1099,'laptop'], ['Microsoft Surface Laptop',999,'laptop'], ['MacBook Air 13 inch M3',999,'laptop'],
    ['Dell Latitude Business Laptop',899,'laptop'], ['Lenovo Yoga 7 2-in-1',899,'laptop'], ['MacBook Air 13 inch M2',899,'laptop'],
    ['ASUS Zenbook 14 OLED',849,'laptop'], ['Acer Nitro gaming laptop',799,'laptop'], ['Lenovo ThinkPad E16 Business Laptop',799,'laptop'],
    ['Samsung Galaxy Book4',749,'laptop'], ['HP Pavilion 15 laptop',649,'laptop'], ['Dell Inspiron 15 laptop',529,'laptop'],
    ['MSI Modern 14 laptop',499,'laptop'], ['ASUS Vivobook 15 laptop',479,'laptop'], ['HP 14 Ryzen laptop',449,'laptop'],
    ['Lenovo IdeaPad 15.6 inch laptop',389,'laptop'], ['Acer Aspire 5 laptop',319,'laptop']
  ]
};

function freeCatalog(q){
  const s = String(q || 'producto').trim();
  const type = /camisa|shirt/i.test(s) ? 'shirt' : /zapato|shoe/i.test(s) ? 'shoe' : /cable|usb/i.test(s) ? 'cable' : 'product';
  return Array.from({length:20},(_,i)=>[`${s} - Amazon Business option ${i+1}`, +(29+i*18.75).toFixed(2), type]);
}

function pickCatalog(q){
  const s = String(q || '').toLowerCase();
  if (s.includes('iphone')) return QUERY_CATALOGS.iphone;
  if (s.includes('laptop') || s.includes('notebook') || s.includes('macbook')) return QUERY_CATALOGS.laptop;
  return freeCatalog(q);
}

function normalize(row, idx){
  const [title, price, imageType] = row;
  const shipping = Math.max(4.99, +(Number(price)*0.07).toFixed(2));
  return {
    id: `amazon-sandbox-${idx+1}`,
    asin: `SANDBOX${String(idx+1).padStart(4,'0')}`,
    name: title,
    title,
    provider: 'Amazon Business',
    proveedor: 'Amazon Business',
    vendor: 'Amazon Business',
    providerLogo: '🟠',
    price: Number(price),
    shippingAmazon: shipping,
    vendorFee: 0,
    category: /iphone|laptop|macbook|notebook|usb|cable/i.test(title) ? 'electronica' : 'general',
    image: null,
    imageType,
    imageOriginalRequired: true,
    url: `https://www.amazon.com/s?k=${encodeURIComponent(title)}`,
    sourceUrl: `https://www.amazon.com/s?k=${encodeURIComponent(title)}`,
    stock: 8 + (idx % 18),
    source: 'amazon-business-sandbox',
    rating: 4.7,
    reviews: 128,
    sandbox: true
  };
}

async function getLwaAccessToken(){
  const client_id = process.env.AMAZON_CLIENT_ID;
  const client_secret = process.env.AMAZON_CLIENT_SECRET;
  const refresh_token = process.env.AMAZON_REFRESH_TOKEN;
  if(!client_id || !client_secret || !refresh_token) return {ok:false, reason:'missing_env'};
  try{
    const body = new URLSearchParams({grant_type:'refresh_token', refresh_token, client_id, client_secret});
    const r = await fetch('https://api.amazon.com/auth/o2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
    if(!r.ok) return {ok:false,status:r.status,reason:'lwa_rejected'};
    const d = await r.json();
    return {ok:Boolean(d.access_token), expires_in:d.expires_in||null};
  }catch(e){ return {ok:false,reason:'lwa_network_error'}; }
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q = String(req.query.q || req.query.search || '').trim();
  const maxPrice = Number(req.query.maxPrice || req.query.max || 0);
  const token = await getLwaAccessToken();
  let products = pickCatalog(q).map(normalize).filter(p => !maxPrice || p.price <= maxPrice);
  products = products.sort((a,b)=>Number(b.price)-Number(a.price));
  return res.status(200).json({
    ok:true,
    provider:'Amazon Business',
    mode:'sandbox',
    credentialsDetected:Boolean(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET && process.env.AMAZON_REFRESH_TOKEN),
    lwaTokenOk:token.ok,
    tokenStatus:token.ok ? 'LWA token generado' : token.reason,
    notice: token.ok ? 'Sandbox activo. Imágenes originales se usarán automáticamente en Producción cuando Amazon entregue URLs válidas.' : 'Sandbox activo. Revise variables LWA.',
    products
  });
}
