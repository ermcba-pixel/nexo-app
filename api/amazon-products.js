// nexo™ – Amazon Affiliate direct card (REAL EXTERNAL LINK ONLY)
// No usa simuladores ni productos inventados. Amazon se abre como tarjeta externa con búsqueda real y tag afiliado.

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma','no-cache');
  res.setHeader('Expires','0');
}
function clean(v){return String(v||'').trim();}
function norm(v){return clean(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();}
function amazonTerm(q){
  const n=norm(q);
  const map={zapato:'zapatos',zapatos:'zapatos',zapatilla:'zapatillas',zapatillas:'zapatillas',tenis:'sneakers',calcetin:'socks',calcetines:'socks',media:'socks',medias:'socks',camisa:'shirt',camisas:'shirts',polera:'t shirt',poleras:'t shirts',blusa:'blouse',blusas:'blouses',pantalon:'pants',pantalones:'pants',mochila:'backpack',mochilas:'backpack',celular:'phone',telefono:'phone',audifonos:'earbuds',auriculares:'earbuds',reloj:'watch',relojes:'watches'};
  return map[n] || clean(q) || 'product';
}
function amazonUrl(q){
  const tag = clean(process.env.AMAZON_ASSOCIATE_TAG || process.env.AMAZON_AFFILIATE_TAG || 'nexo20-8');
  const url = new URL('https://www.amazon.com/s');
  url.searchParams.set('k', amazonTerm(q));
  url.searchParams.set('tag', tag);
  return url.toString();
}
export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q = clean(req.query.q || req.query.search || req.query.originalQ || 'producto');
  const url = amazonUrl(q);
  const id = 'amazon-direct-'+norm(q).replace(/[^a-z0-9]+/g,'-');
  return res.status(200).json({
    ok:true,
    provider:'Amazon',
    mode:'amazon_affiliate_external_direct',
    count:1,
    products:[{
      id, sku:id.toUpperCase(), asin:'', name:'Ver '+q+' en Amazon', title:'Ver '+q+' en Amazon',
      provider:'Amazon', proveedor:'Amazon', vendor:'Amazon', providerLogo:'🇺🇸',
      amazonDirect:true, externalOnly:true, price:0, displayPrice:'Ver precio en Amazon',
      sourceUrl:url, url, originalProviderUrl:url, image:'', stock:'Verificar disponibilidad y precio final en Amazon',
      features:'Amazon se abre fuera de nexo con búsqueda real y tag afiliado.', source:'amazon-affiliate-direct-real'
    }],
    message:'Amazon afiliado activo: tarjeta externa con búsqueda real y tag afiliado.'
  });
}
