// nexo™ – guarda perfil de pago protegido en Supabase
// Nunca guarda CVV. Tarjeta solo se guarda en máscara/últimos 4. Cuenta bancaria se guarda en máscara.
function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store');
}
function safe(obj){
  const x = JSON.parse(JSON.stringify(obj || {}));
  if(x.card){ delete x.card.cvv; delete x.card.cvv2; delete x.card.securityCode; delete x.card.number; }
  if(x.profile?.card){ delete x.profile.card.cvv; delete x.profile.card.cvv2; delete x.profile.card.securityCode; delete x.profile.card.number; }
  if(x.bank?.accountNumber){ delete x.bank.accountNumber; }
  return x;
}
export default async function handler(req,res){
  cors(res);
  if(req.method==='OPTIONS') return res.status(200).end();
  if(req.method==='GET') return res.status(200).json({ok:true,service:'nexo-save-payment-profile'});
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  try{
    const body=safe(req.body||{});
    const cliente=body.cliente||{};
    const metodo=String(body.metodo||'').toLowerCase();
    const payload={
      cliente_email: cliente.email || body.email || null,
      cliente_documento: cliente.documentId || cliente.documento || null,
      metodo,
      card_last4: body.card?.last4 || null,
      card_brand: body.card?.brand || null,
      card_number_masked: body.card?.cardNumberMasked || body.card?.maskedNumber || body.card?.numberMasked || null,
      card_expiry: body.card?.expiry || body.card?.expiryDate || null,
      bank_name: body.bank?.bankName || null,
      bank_routing: body.bank?.routingNumber || null,
      bank_account_masked: body.bank?.accountNumberMasked || null,
      payload: body,
      updated_at: new Date().toISOString()
    };
    try{
      const url=process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key=process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if(url && key){
        const r=await fetch(`${url}/rest/v1/client_payment_profiles`,{
          method:'POST',
          headers:{apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=minimal'},
          body: JSON.stringify(payload)
        });
        if(!r.ok){
          const txt=await r.text().catch(()=>'');
          return res.status(200).json({ok:true, saved:false, reason:'Tabla client_payment_profiles no existe o RLS bloqueó inserción', detail:txt});
        }
        return res.status(200).json({ok:true,saved:true});
      }
    }catch(e){
      return res.status(200).json({ok:true,saved:false,reason:e.message});
    }
    return res.status(200).json({ok:true,saved:false,reason:'Supabase no configurado'});
  }catch(err){
    return res.status(500).json({ok:false,error:err.message||'save_payment_profile_failed'});
  }
}
