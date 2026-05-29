// nexo™ – Agente 1: intake interno de cobro y orden CJ
// No redirige al cliente a PayPal clásico. Registra la intención para captura server-side / PayPal Advanced.
// Requiere para producción real: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV=live, CJ_API_KEY.

function cors(res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store');
}
function money(v){ const n=Number(v||0); return Number.isFinite(n) ? Number(n.toFixed(2)) : 0; }
function mask(v){ return String(v||'').replace(/\s+/g,'').replace(/.(?=.{4})/g,'•'); }

export default async function handler(req,res){
  cors(res);
  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method === 'GET'){
    return res.status(200).json({
      ok:true,
      service:'agent1-intake-payment',
      paypalAdvancedReady:Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      cjReady:Boolean(process.env.CJ_API_KEY),
      mode:'server-side-intake'
    });
  }
  if(req.method !== 'POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  try{
    const order = req.body || {};
    const paymentMethod = String(order.paymentMethod || '').toLowerCase();
    const id = order.supabase_id || order.id || ('NEXO-' + Date.now());
    const subtotal = money(order.subtotal || order?.totals?.subtotal);
    const shipping = money(order.amazonShipping || order?.totals?.amazonShipping);
    const vendorFees = money(order.vendorFees || order?.totals?.vendorFees);
    const commission = money(order.commission || order?.totals?.commission);
    const total = money(order.total || order?.totals?.total);

    const intake = {
      ok:true,
      id,
      status:'pendiente_captura_server_side',
      agentStatus:'agente_1_listo_para_captura_y_compra_cj',
      paymentMethod,
      totals:{subtotal, shipping, vendorFees, commission, total},
      paypalBusiness:'nexo PayPal Business',
      provider:'CJ Dropshipping',
      cjReady:Boolean(process.env.CJ_API_KEY),
      paypalAdvancedReady:Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      next:[
        'capturar pago del cliente por PayPal Advanced/Complete Payments',
        'confirmar webhook de pago aprobado',
        'crear orden CJ con datos de cliente y envío',
        'registrar tracking y comisión neta'
      ],
      createdAt:new Date().toISOString()
    };

    if(paymentMethod === 'bank'){
      intake.bank = {
        holder: order?.bankPayment?.holder || '',
        bankName: order?.bankPayment?.bankName || '',
        rail: order?.bankPayment?.rail || 'ACH/Wire',
        routing: order?.bankPayment?.routingNumber || '',
        accountMasked: order?.bankPayment?.accountNumberMasked || mask(order?.bankPayment?.accountNumber || ''),
        reference: order?.bankPayment?.reference || ''
      };
    }
    if(paymentMethod === 'card'){
      intake.card = {
        mode:'PayPal Advanced Card Fields / server-side capture',
        storesCardData:false,
        cvvStored:false
      };
    }
    if(paymentMethod === 'payoneer'){
      intake.payoneer = {mode:'Payoneer registrado como rail operativo; captura final debe confirmarse por backend autorizado'};
    }

    // Intento opcional de registrar en Supabase si existen variables del proyecto.
    try{
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if(url && key){
        await fetch(`${url}/rest/v1/agent1_payment_intake`, {
          method:'POST',
          headers:{apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json', Prefer:'return=minimal'},
          body: JSON.stringify({pedido_id:id, metodo:paymentMethod, total, estado:intake.status, payload:intake})
        }).catch(()=>null);
      }
    }catch(e){}

    return res.status(200).json(intake);
  }catch(err){
    return res.status(500).json({ok:false,error:err.message || 'agent1_intake_failed'});
  }
}
