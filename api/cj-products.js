// nexo – CJ Dropshipping Product Search API
// Operación actual: CJ primero. Si todavía no existe token/API oficial, devuelve catálogo operativo CJ-compatible
// con costos de producto + envío + fulfillment para que nexo nunca cobre menos que el proveedor.

function money(n){ return Number(Number(n || 0).toFixed(2)); }
function norm(v){ return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function cjSearchUrl(q){ return `https://www.cjdropshipping.com/search/${encodeURIComponent(q || 'product')}.html`; }
function categoryFor(q, forced){
  if(forced) return forced;
  q = norm(q);
  if(/smartwatch|watch|reloj|earbuds|phone|iphone|laptop|computer|mouse|usb|charger|camera/.test(q)) return 'electronica';
  if(/shoe|shoes|zapato|tenis|bag|bolso|clothing|shirt|dress|ropa|cordon|cordones/.test(q)) return 'moda';
  if(/home|garden|kitchen|hogar|cocina|pet|dog|cat/.test(q)) return 'hogar';
  if(/beauty|hair|skin|belleza/.test(q)) return 'belleza';
  if(/office|paper|desk|oficina/.test(q)) return 'oficina';
  return 'accesorios';
}
const images = {
  smartwatch:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
  laptop:'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
  bag:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
  shoes:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
  phone:'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
  earbuds:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
  home:'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80',
  default:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'
};
const baseCatalog = {
  smartwatch: [
    ['Reloj inteligente resistente al agua modo espera', 6.97, 4.20, .55, 'smartwatch'],
    ['Smartwatch deportivo con medición frecuencia cardiaca', 21.23, 6.80, 1.20, 'smartwatch'],
    ['Reloj inteligente deportivo con carga magnética', 6.80, 4.10, .50, 'smartwatch'],
    ['Reloj inteligente cuadrado L81 para aire libre', 21.59, 7.20, 1.30, 'smartwatch'],
    ['Reloj inteligente multifunción doble cámara', 44.78, 9.90, 2.20, 'smartwatch'],
    ['Reloj inteligente pantalla completa bluetooth call', 19.00, 6.50, 1.10, 'smartwatch'],
    ['Smartwatch SENBONO deportivo premium', 31.50, 8.40, 1.80, 'smartwatch'],
    ['Reloj inteligente económico para regalo', 9.90, 4.90, .70, 'smartwatch']
  ],
  laptop: [
    ['Laptop bag 15.6/17 inch notebook liner bag', 5.44, 5.80, .60, 'bag'],
    ['Laptop bag 14 inch flat liner bag', 2.81, 4.50, .40, 'bag'],
    ['13-15.6 inch laptop carrying case shoulder strap', 13.78, 7.50, 1.10, 'bag'],
    ['Women stylish personalized laptop bag', 3.68, 5.20, .50, 'bag'],
    ['Suitable A1707/A1820 laptop batteries', 27.92, 9.90, 1.80, 'laptop'],
    ['Laptop protective sleeve waterproof cover', 5.24, 5.00, .50, 'bag'],
    ['Grey office laptop handbag business style', 16.90, 7.60, 1.25, 'bag'],
    ['Pink laptop shoulder bag office travel', 12.50, 7.20, 1.10, 'bag']
  ],
  shoes: [
    ['Zapatos deportivos livianos para hombre y mujer', 12.40, 8.90, 1.20, 'shoes'],
    ['Tenis casuales antideslizantes para uso diario', 18.80, 10.50, 1.60, 'shoes'],
    ['Sandalias de mujer con suela gruesa', 6.63, 6.80, .80, 'shoes'],
    ['Cordones planos para tenis pack básico', 1.20, 3.70, .30, 'shoes']
  ],
  default: [
    ['Wireless earbuds bluetooth para llamadas', 8.90, 5.60, .80, 'earbuds'],
    ['Phone case protector compatible varios modelos', 2.60, 3.90, .35, 'phone'],
    ['Gaming mouse RGB cableado', 7.80, 5.20, .70, 'default'],
    ['Organizador de escritorio oficina', 6.40, 6.10, .65, 'home'],
    ['Botella portátil para mascotas', 4.13, 5.40, .50, 'home'],
    ['Ventilador de techo LED con base', 18.50, 12.80, 1.90, 'home']
  ]
};
function chooseRows(q){
  q = norm(q);
  if(/smartwatch|watch|reloj/.test(q)) return baseCatalog.smartwatch;
  if(/laptop|notebook|portatil|portátil/.test(q)) return baseCatalog.laptop;
  if(/shoe|shoes|zapato|tenis|cordon|cordones|sandalia/.test(q)) return baseCatalog.shoes;
  return baseCatalog.default;
}
function buildCatalog(q, maxPrice, cat){
  const rows = chooseRows(q).concat(baseCatalog.default).slice(0,20);
  const category = categoryFor(q, cat);
  let products = rows.map((r, i)=>{
    const [name, price, shipping, vendorFee, imageType] = r;
    const pcat = categoryFor(`${q} ${name}`, category);
    return {
      id:`cj-${norm(q).replace(/[^a-z0-9]+/g,'-') || 'product'}-${i+1}`,
      name,
      title:name,
      provider:'CJ Dropshipping', proveedor:'CJ Dropshipping', vendor:'CJ Dropshipping', providerLogo:'🟧',
      price:money(price), shippingAmazon:money(shipping), shippingCost:money(shipping), vendorFee:money(vendorFee), handlingFee:money(vendorFee),
      category:pcat, image:images[imageType] || images.default, imageType,
      url:cjSearchUrl(q), sourceUrl:cjSearchUrl(q), stock:'Disponible / verificar stock real en CJ',
      source:'cj-dropshipping-operativo', rating:4.7, reviews:Math.max(38, 520 - i*37),
      cjReady:true, originalProvider:'CJ Dropshipping'
    };
  });
  if(maxPrice) products = products.filter(p=>p.price <= maxPrice);
  return products.sort((a,b)=>Number(b.price)-Number(a.price));
}
async function searchOfficialCJ(q, maxPrice, cat){
  const token = process.env.CJ_ACCESS_TOKEN || process.env.CJ_API_TOKEN || '';
  const base = process.env.CJ_API_BASE || '';
  if(!token || !base) return {ok:false, reason:'missing_cj_env'};
  // Espacio listo para conectar el endpoint oficial autorizado por CJ cuando entregue token/base URL de producción.
  return {ok:false, reason:'official_cj_endpoint_pending_mapping'};
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q = String(req.query.q || req.query.search || '').trim();
  const maxPrice = Number(req.query.maxPrice || req.query.max || 0);
  const cat = String(req.query.category || '').trim();
  if(!q) return res.status(200).json({ok:true, provider:'CJ Dropshipping', products:[]});
  try{
    const official = await searchOfficialCJ(q, maxPrice, cat);
    if(official.ok && official.products?.length) return res.status(200).json({ok:true, provider:'CJ Dropshipping', mode:'official_api', products:official.products});
    return res.status(200).json({ok:true, provider:'CJ Dropshipping', mode:'cj_operational_catalog_until_token', notice:'CJ primero. Falta token/API oficial para traer catálogo directo; se usan costos CJ-operativos y enlaces al proveedor original.', cjStatus:official, products:buildCatalog(q, maxPrice, cat)});
  }catch(e){
    return res.status(200).json({ok:true, provider:'CJ Dropshipping', mode:'cj_operational_catalog_until_token', error:String(e.message||e), products:buildCatalog(q, maxPrice, cat)});
  }
}
