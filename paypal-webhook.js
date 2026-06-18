// nexo™ – PayPal Advanced Checkout client config
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Cache-Control','no-store');
}
export default function handler(req,res){
  cors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || '';
  const env = (process.env.PAYPAL_ENV || 'live').toLowerCase();
  return res.status(200).json({
    ok:Boolean(clientId),
    clientId: clientId ? clientId : null,
    env,
    components:'buttons,card-fields',
    currency:'USD',
    intent:'capture'
  });
}
