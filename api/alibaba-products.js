// nexo – Alibaba Product Search API
// Etapa actual: integración preparada para Alibaba.
// Si no existen credenciales oficiales de Alibaba Open Platform, devuelve opciones Alibaba verificables por enlace de búsqueda
// para que la tienda sea multi-proveedor y no quede limitada a CJ.

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
}

function money(n){ const x=Number(n||0); return Number.isFinite(x) ? Number(x.toFixed(2)) : 0; }
function clean(s){ return String(s||'').trim(); }
function norm(s){ return clean(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function enc(s){ return encodeURIComponent(clean(s)||'product'); }

function guessCategory(q){
  const t=norm(q);
  if(/laptop|notebook|computadora|pc|monitor|teclado|mouse|celular|telefono|iphone|audifono|auricular|electron/.test(t)) return 'electronica';
  if(/ropa|camisa|pantalon|zapato|zapatilla|calzado|moda|bolso|cartera/.test(t)) return 'moda';
  if(/hogar|mueble|cocina|decoracion/.test(t)) return 'hogar';
  if(/belleza|cosmetico|perfume|crema/.test(t)) return 'belleza';
  return 'general';
}

function alibabaSearchUrl(q){
  return `https://www.alibaba.com/trade/search?SearchText=${enc(q)}`;
}

function tempAlibabaCatalog(q, maxPrice, size=10){
  const base = clean(q) || 'producto';
  const category = guessCategory(base);
  const prices = [18,24,32,45,58,75,95,120,150,210,280,350];
  const names = [
    `${base} - proveedor Alibaba verificado`,
    `${base} wholesale supplier Alibaba`,
    `${base} exportación internacional Alibaba`,
    `${base} fabricante China Alibaba`,
    `${base} lote mínimo proveedor Alibaba`,
    `${base} opción premium Alibaba`,
    `${base} envío internacional Alibaba`,
    `${base} proveedor OEM Alibaba`,
    `${base} marketplace Alibaba`,
    `${base} proveedor mayorista Alibaba`
  ];
  let products = names.slice(0,size).map((name,idx)=>{
    const p = prices[idx % prices.length];
    const url = alibabaSearchUrl(`${base} ${idx>2 ? 'supplier' : ''}`);
    return {
      id:`alibaba-temp-${idx+1}-${Buffer.from(base).toString('base64').replace(/[^a-zA-Z0-9]/g,'').slice(0,8)}`,
      sku:`ALI-${idx+1}`,
      name,
      title:name,
      provider:'Alibaba',
      proveedor:'Alibaba',
      vendor:'Alibaba',
      providerLogo:'🟧',
      price:money(p),
      cjProductCost:money(p),
      shippingAmazon:0,
      cjShippingCost:0,
      vendorFee:0,
      cjHandlingFee:0,
      category,
      image:'',
      sourceUrl:url,
      url,
      stock:'Verificar MOQ, stock y precio final con proveedor Alibaba',
      source:'alibaba-preapi-catalog',
      originalAlibaba:true,
      apiPendiente:true,
      features:'Proveedor Alibaba disponible para integración. Precio referencial; confirmar MOQ, variantes, flete y Trade Assurance.'
    };
  });
  if(Number(maxPrice)>0) products = products.filter(p=>p.price<=Number(maxPrice));
  return products.sort((a,b)=>Number(b.price)-Number(a.price));
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q = clean(req.query.q || req.query.search || req.query.keyword || '');
  const maxPrice = Number(req.query.maxPrice || req.query.max || 0);
  const size = Math.min(Math.max(Number(req.query.size || 10),1),50);

  // Aquí se conectará Alibaba Open Platform cuando tengamos APP_KEY / APP_SECRET y permisos de catálogo.
  const hasAlibabaApi = !!(process.env.ALIBABA_APP_KEY && process.env.ALIBABA_APP_SECRET);
  return res.status(200).json({
    ok:true,
    provider:'Alibaba',
    mode: hasAlibabaApi ? 'api_credentials_present_pending_mapping' : 'preapi_search_catalog',
    notice: hasAlibabaApi
      ? 'Credenciales Alibaba detectadas. Falta mapear endpoint oficial autorizado para catálogo.'
      : 'Alibaba se muestra como proveedor preparado por enlaces de búsqueda mientras se habilita la API oficial.',
    products: tempAlibabaCatalog(q, maxPrice, size)
  });
}
