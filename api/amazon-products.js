// nexo™ – Amazon Affiliate Search Bridge
// Amazon PA-API exige ventas/mes. Temporalmente NO se inventan 15 productos.
// Devuelve UNA tarjeta Amazon primero, con enlace afiliado nexo20-8 a la búsqueda real en Amazon.

const MARKETPLACE = process.env.AMAZON_MARKETPLACE || 'www.amazon.com';
const PARTNER_TAG = process.env.AMAZON_ASSOCIATE_TAG || process.env.AMAZON_PARTNER_TAG || process.env.AMAZON_TAG || 'nexo20-8';

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');
}
function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
function translate(q){
  const k=norm(q);
  const map={camisa:'shirt',camisas:'shirts',polera:'t shirt',poleras:'t shirts',blusa:'blouse',blusas:'blouses',zapato:'shoes',zapatos:'shoes',zapatilla:'sneakers',zapatillas:'sneakers',tenis:'sneakers',calcetin:'socks',calcetines:'socks',medias:'socks',media:'socks',mochila:'backpack',mochilas:'backpack',reloj:'watch',relojes:'watch',celular:'phone',telefono:'phone',audifonos:'earbuds',auriculares:'earbuds'};
  return map[k] || String(q||'product').trim() || 'product';
}
function amazonUrl(q){
  const u = new URL(`https://${MARKETPLACE}/s`);
  u.searchParams.set('k', translate(q));
  u.searchParams.set('tag', PARTNER_TAG);
  return u.toString();
}
function similarImage(q){
  const k=norm(q);
  // Amazon es el único proveedor donde usamos imagen referencial temporal porque no hay PA-API habilitada.
  if(/camisa|shirt|polera|blusa/.test(k)) return 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80';
  if(/zapato|zapatilla|tenis|shoe|sneaker/.test(k)) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80';
  if(/calcetin|media|sock/.test(k)) return 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=900&q=80';
  if(/mochila|bag|backpack/.test(k)) return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80';
  if(/reloj|watch/.test(k)) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80';
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80';
}

export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q=String(req.query.q||req.query.search||'producto').trim() || 'producto';
  const url=amazonUrl(q);
  const product={
    id:'amazon-direct-'+norm(q).replace(/[^a-z0-9]+/g,'-'),
    name:`Ver ${q} en Amazon`,
    title:`Ver ${q} en Amazon`,
    provider:'Amazon', proveedor:'Amazon', vendor:'Amazon', providerLogo:'🇺🇸',
    price:0.01, displayPrice:'Ver precio en Amazon',
    shippingAmazon:0, cjShippingCost:0, vendorFee:0, cjHandlingFee:0,
    category:'Amazon', stock:'Compra directa en Amazon. Confirmar precio, disponibilidad y envío en Amazon.',
    image:similarImage(q), url, sourceUrl:url, originalProviderUrl:url,
    amazonDirect:true, externalOnly:true, source:'amazon-affiliate-direct',
    features:`Amazon temporalmente abre resultados reales en Amazon con afiliado ${PARTNER_TAG}. La compra se completa directamente en Amazon.`
  };
  return res.status(200).json({
    ok:true,
    provider:'Amazon',
    mode:'affiliate_direct_one_card',
    count:1,
    products:[product],
    amazonSearchUrl:url,
    message:'Amazon se muestra como una sola tarjeta con enlace afiliado directo hasta habilitar PA-API.'
  });
}
