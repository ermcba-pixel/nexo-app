// nexo – Amazon real redirect search
// Mientras Amazon habilita PA-API oficial, NO se muestra catálogo falso.
// El sistema genera tarjetas de búsqueda que abren Amazon real con el tag nexo08-20.

const MARKETPLACE = process.env.AMAZON_MARKETPLACE || 'www.amazon.com';
const ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'nexo08-20';

function cleanText(v){ return String(v || '').trim(); }
function amazonSearchUrl(query, maxPrice){
  const q = cleanText(query) || 'productos';
  const params = new URLSearchParams();
  params.set('k', q);
  params.set('tag', ASSOCIATE_TAG);
  // Amazon no acepta un maxPrice universal consistente en la URL para todos los países,
  // por eso se lleva el término y el cliente confirma precio en Amazon real.
  return `https://${MARKETPLACE}/s?${params.toString()}`;
}
function buildRedirectProducts(q, maxPrice){
  const query = cleanText(q) || 'productos amazon';
  const max = Number(maxPrice || 0);
  const titleBase = max > 0 ? `${query} hasta USD ${max}` : query;
  const variants = [
    titleBase,
    `${query} oferta`,
    `${query} económico`,
    `${query} mejor valor`,
    `${query} envío internacional`,
    `${query} Amazon`
  ];
  return variants.map((name, idx)=>({
    id:`amazon-real-${idx+1}`,
    name,
    title:name,
    provider:'Amazon', proveedor:'Amazon', vendor:'Amazon', providerLogo:'🟠',
    price:max > 0 ? max : 0,
    displayPrice:max > 0 ? `Ver en Amazon hasta USD ${max}` : 'Ver precio real en Amazon',
    shippingAmazon:null,
    vendorFee:null,
    category:'amazon-real',
    image:'',
    imageType:'product',
    sourceUrl:amazonSearchUrl(query, max),
    url:amazonSearchUrl(query, max),
    stock:'Verificar disponibilidad y precio real en Amazon',
    source:'amazon-real-redirect',
    rating:null,
    reviews:0,
    originalAmazon:true,
    redirectOnly:true,
    notice:'Búsqueda real en Amazon con tag nexo08-20. PA-API pendiente de habilitación por ventas calificadas.'
  }));
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método no permitido'});
  const q=cleanText(req.query.q || req.query.search || req.query.keyword || '');
  const maxPrice=Number(req.query.maxPrice || req.query.max || 0);
  return res.status(200).json({
    ok:true,
    provider:'Amazon',
    mode:'amazon_real_redirect_until_paapi',
    affiliateTag:ASSOCIATE_TAG,
    originalImages:false,
    redirectOnly:true,
    notice:'Amazon PA-API aún no está habilitado. nexo abre Amazon real con tag de afiliado para generar ventas calificadas.',
    products:buildRedirectProducts(q, maxPrice)
  });
}
