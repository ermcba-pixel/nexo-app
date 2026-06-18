export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({
    ok:true,
    paypal_live:(process.env.PAYPAL_ENV||'live').toLowerCase()==='live' && !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET,
    cj_api:!!process.env.CJ_API_KEY,
    stripe_live:!!process.env.STRIPE_SECRET_KEY,
    note:'Para débito directo de tarjeta sin salir a PayPal se requiere Stripe LIVE o PayPal Advanced Cards/Hosted Fields. No se debe capturar CVV en HTML propio.'
  });
}
