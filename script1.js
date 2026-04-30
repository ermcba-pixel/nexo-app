
        // CAMBIAR SECCIÓN
        function switchSection(sectionId, element) {
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });

            const targetSection = document.getElementById(sectionId);
            if (targetSection) targetSection.classList.add('active');

            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            if (element) element.classList.add('active');

            const backBtn = document.getElementById('dashboardReturnBtn');
            if (backBtn) {
                backBtn.style.display = 'none';
            }

            if (sectionId === 'dashboard') {
                loadDashboard();
            } else if (sectionId === 'orders') {
                loadOrders();
            } else if (sectionId === 'customers') {
                renderCustomers();
            } else if (sectionId === 'payments') {
                renderPayments();
            } else if (sectionId === 'shipments') {
                renderShipments();
            } else if (sectionId === 'products') {
                renderProducts();
            } else if (sectionId === 'users') {
                renderUsers();
            } else if (sectionId === 'reports') {
                applyReportFilters();
            } else if (sectionId === 'tickets') {
                loadTickets();
            } else if (sectionId === 'clientdata') {
                renderClientData();
            }
        }


        
        function renderClientData(){
            // Módulo reservado para datos de clientes. Se deja seguro para evitar errores de navegación.
            return true;
        }

function getClientProfile() {
            return JSON.parse(localStorage.getItem('nexoClientProfile') || sessionStorage.getItem('nexoActiveClient') || '{}');
        }

        function filterOrdersByDates(orders){
            const mode = document.getElementById('reportMode')?.value || 'all';
            const base = document.getElementById('reportBaseDate')?.value;
            const from = document.getElementById('reportFromDate')?.value;
            const to = document.getElementById('reportToDate')?.value;
            return orders.filter(o=>{
                const d = new Date(o.timestamp || Date.now());
                const ds = d.toISOString().slice(0,10);
                if(mode==='day' && base) return ds===base;
                if(mode==='month' && base) return ds.slice(0,7)===base.slice(0,7);
                if(mode==='year' && base) return ds.slice(0,4)===base.slice(0,4);
                if(mode==='range' && from && to) return ds>=from && ds<=to;
                return true;
            });
        }

        function applyReportFilters(){
            const orders = filterOrdersByDates(getOrdersData());
            const total = orders.reduce((a,o)=>a+Number(o.totals?.total ?? o.total ?? 0),0);
            const net = orders.reduce((a,o)=>a+Number(o.totals?.netCommissionAfterTaxes ?? o.netCommissionAfterTaxes ?? 0),0);
            const bank = orders.reduce((a,o)=>a+Number(o.totals?.bankBalance ?? o.bankBalance ?? 0),0);
            document.getElementById('reportOrdersCount').textContent = String(orders.length);
            document.getElementById('reportTotalCollected').textContent = toMoney(total);
            document.getElementById('reportNetCommission').textContent = toMoney(net);
            document.getElementById('reportBankDiff').textContent = toMoney(bank-net);
            const preview = document.getElementById('reportPreview');
            if(preview){
                preview.innerHTML = `<div class="section-box-title">Vista previa</div>
                <table class="table"><thead><tr><th>Fecha</th><th>Factura</th><th>Cliente</th><th>Total</th><th>Comisión neta</th></tr></thead>
                <tbody>${orders.length?orders.map(o=>`<tr><td>${new Date(o.timestamp||Date.now()).toLocaleDateString('es-BO')}</td><td>${o.id||''}</td><td>${o.customer?.fullName || o.fullName || ''}</td><td>${toMoney(o.totals?.total ?? o.total ?? 0)}</td><td>${toMoney(o.totals?.netCommissionAfterTaxes ?? o.netCommissionAfterTaxes ?? 0)}</td></tr>`).join(''):`<tr><td colspan="5">Sin datos para el filtro seleccionado</td></tr>`}</tbody></table>`;
            }
        }

        function renderCustomers(){
            const tbody = document.getElementById('customersTable');
            if(!tbody) return;
            const profile = getClientProfile();
            const orders = getOrdersData();
            if(!profile.email && !orders.length){ tbody.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--gray);">No hay clientes registrados</td></tr>'; return; }
            const orderCount = orders.filter(o=>(o.customer?.email || o.email || '').toLowerCase() === String(profile.email||'').toLowerCase()).length;
            tbody.innerHTML = `<tr><td>${profile.fullName || ''}</td><td>${profile.email || ''}</td><td>${profile.areaCode || ''} ${profile.phone || ''}</td><td>${profile.country || profile.countryCode || ''}</td><td>${profile.city || ''}</td><td>${profile.address || ''}</td><td>${profile.documentId || profile.documentNumber || ''}</td><td>${orderCount}</td></tr>`;
            const head = tbody.parentElement.querySelector('thead tr');
            if(head && head.children.length<8){ head.innerHTML='<th>NOMBRE</th><th>EMAIL</th><th>TELÉFONO</th><th>PAÍS</th><th>CIUDAD</th><th>DIRECCIÓN</th><th>DOCUMENTO</th><th>PEDIDOS</th>'; }
        }

        function renderPayments(){
            const sec = document.getElementById('payments');
            if(!sec) return;
            const orders = getOrdersData();
            const by = {card:0, bank:0, paypal:0, payoneer:0};
            orders.forEach(o=>{ const k=(o.paymentMethod||'').toLowerCase(); if(k.includes('card')||k.includes('tarjeta')) by.card++; else if(k.includes('bank')||k.includes('transfer')) by.bank++; else if(k.includes('payoneer')) by.payoneer++; else by.paypal++; });
            const cards = sec.querySelectorAll('.card-value');
            if(cards.length>=4){ cards[0].textContent=String(by.card); cards[1].textContent=String(by.bank); cards[2].textContent=String(by.paypal); cards[3].textContent=String(by.payoneer); }
            let box = document.getElementById('paymentsTableWrap');
            if(!box){ box=document.createElement('div'); box.id='paymentsTableWrap'; box.className='section-box'; sec.appendChild(box); }
            box.innerHTML = `<div class="section-box-title">Detalle horizontal de pagos</div><div style="overflow:auto"><table class="table"><thead><tr><th>Factura</th><th>Cliente</th><th>Método</th><th>Total cobrado</th><th>Proveedor</th><th>Comisión neta</th></tr></thead><tbody>${orders.length?orders.map(o=>`<tr><td>${o.id||''}</td><td>${o.customer?.fullName || o.fullName || ''}</td><td>${(o.paymentMethod||'').toUpperCase()}</td><td>${toMoney(o.totals?.total ?? o.total ?? 0)}</td><td>${toMoney(o.totals?.providerPayment ?? o.providerPayment ?? 0)}</td><td>${toMoney(o.totals?.netCommissionAfterTaxes ?? o.netCommissionAfterTaxes ?? 0)}</td></tr>`).join(''):`<tr><td colspan="6">Sin pagos registrados</td></tr>`}</tbody></table></div>`;
        }

        function renderShipments(){
            const box = document.getElementById('shipmentsPanel');
            if(!box) return;
            const orders = getOrdersData();
            box.innerHTML = `<table class="table"><thead><tr><th>Factura</th><th>Cliente</th><th>Destino</th><th>Entrega estimada</th><th>Estado</th></tr></thead><tbody>${orders.length?orders.map(o=>`<tr><td>${o.id||''}</td><td>${o.customer?.fullName || o.fullName || ''}</td><td>${o.customer?.city || o.city || ''}</td><td>${o.deliveryEstimate || ''}</td><td>En preparación</td></tr>`).join(''):`<tr><td colspan="5">Sin envíos registrados</td></tr>`}</tbody></table>`;
        }

        function renderProducts(){
            const box = document.getElementById('productsPanel');
            if(!box) return;
            const items = getOrdersData().flatMap(o => (o.items || []));
            box.innerHTML = `<table class="table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Envío Amazon</th><th>Gasto vendedor</th></tr></thead><tbody>${items.length?items.map(i=>`<tr><td>${i.name||''}</td><td>${i.quantity||1}</td><td>${toMoney(i.price||0)}</td><td>${toMoney(i.shippingAmazon||0)}</td><td>${toMoney(i.vendorFee||0)}</td></tr>`).join(''):`<tr><td colspan="5">Sin productos registrados</td></tr>`}</tbody></table>`;
        }

        function renderUsers(){
            const box = document.getElementById('usersPanel');
            if(!box) return;
            const adminEmail = localStorage.getItem('nexoAdminEmail') || 'ermcba@hotmail.com';
            box.innerHTML = `<table class="table"><thead><tr><th>Rol</th><th>Correo</th><th>Permisos</th><th>Acciones</th></tr></thead><tbody>
            <tr><td>Superadministrador</td><td>${adminEmail}</td><td>Control total</td><td><button class="action-btn" onclick="openAssignPassword('Superadministrador')">Asignar clave</button><button class="action-btn secondary" onclick="alert('Permisos del Superadministrador protegidos')">Permisos</button></td></tr>
            <tr><td>Admin</td><td>admin@nexo</td><td>Panel general</td><td><button class="action-btn" onclick="openAssignPassword('Admin')">Asignar clave</button><button class="action-btn secondary" onclick="alert('Edición de permisos de Admin lista para configuración')">Permisos</button></td></tr>
            <tr><td>Operador</td><td>operador@nexo</td><td>Pedidos y soporte</td><td><button class="action-btn" onclick="openAssignPassword('Operador')">Asignar clave</button><button class="action-btn secondary" onclick="alert('Edición de permisos de Operador lista para configuración')">Permisos</button></td></tr>
            <tr><td>Finanzas</td><td>finanzas@nexo</td><td>Pagos y reportes</td><td><button class="action-btn" onclick="openAssignPassword('Finanzas')">Asignar clave</button><button class="action-btn secondary" onclick="alert('Edición de permisos de Finanzas lista para configuración')">Permisos</button></td></tr>
            </tbody></table>`;
        }

        function openModal(id){ document.getElementById(id).classList.add('show'); }
        function closeModal(id){ document.getElementById(id).classList.remove('show'); }

        function changeAdminPassword(){
            openModal('passwordModal');
        }

        function saveAdminPassword(){
            const current = document.getElementById('currentAdminPassword').value.trim();
            const next = document.getElementById('newAdminPassword').value.trim();
            if(!current || !next){ alert('Completa ambos campos'); return; }
            const access = JSON.parse(localStorage.getItem('nexoAdminAccess') || '{}');
            access.password = next;
            localStorage.setItem('nexoAdminAccess', JSON.stringify(access));
            closeModal('passwordModal');
            alert('Contraseña actualizada correctamente');
        }

        function activate2FA(){
            openModal('twoFAModal');
        }

        function confirm2FA(){
            const code = Math.random().toString().slice(2,8);
            localStorage.setItem('nexo2FACode', code);
            closeModal('twoFAModal');
            alert('2FA activado correctamente. Código de respaldo: ' + code);
        }

        function openAssignPassword(role){
            document.getElementById('assignRole').value = role;
            document.getElementById('assignPassword').value = '';
            openModal('assignPasswordModal');
        }

        function saveAssignedPassword(){
            const role = document.getElementById('assignRole').value;
            const pass = document.getElementById('assignPassword').value.trim();
            if(!pass){ alert('Ingresa una contraseña'); return; }
            const store = JSON.parse(localStorage.getItem('nexoUserPasswords') || '{}');
            store[role] = pass;
            localStorage.setItem('nexoUserPasswords', JSON.stringify(store));
            closeModal('assignPasswordModal');
            alert('Clave asignada para ' + role);
        }

        function saveSettings(){
            const lang = document.getElementById('platformLang')?.value || 'Español (ES)';
            const tz = document.getElementById('platformTimezone')?.value || 'America/La_Paz (BOT)';
            localStorage.setItem('nexoAdminSettings', JSON.stringify({lang, tz}));
            alert('Ajustes guardados correctamente');
        }

        function exportItReport(format){
            const orders = filterOrdersByDates(getOrdersData());
            const headers = ['Fecha','Factura','Cliente','Comisión','IT 3%'];
            const rows = orders.map(o=>[new Date(o.timestamp||Date.now()).toLocaleDateString('es-BO'), o.id||'', o.customer?.fullName || o.fullName || '', Number(o.totals?.commission ?? o.commission ?? 0).toFixed(2), Number(o.totals?.itf ?? o.itf ?? 0).toFixed(2)]);
            if(format==='csv') return makeCsv('nexo_it.csv', headers, rows);
            openPrintableReport('Resumen IT sobre comisión', 'Cálculo 3% sobre comisión de intermediación', headers, rows, [{label:'Total IT', value: toMoney(rows.reduce((a,r)=>a+Number(r[4]||0),0))}]);
        }

        function exportIueReport(format){
            const orders = filterOrdersByDates(getOrdersData());
            const headers = ['Fecha','Factura','Cliente','Comisión','IUE 25%'];
            const rows = orders.map(o=>[new Date(o.timestamp||Date.now()).toLocaleDateString('es-BO'), o.id||'', o.customer?.fullName || o.fullName || '', Number(o.totals?.commission ?? o.commission ?? 0).toFixed(2), Number(o.totals?.iue ?? o.iue ?? 0).toFixed(2)]);
            if(format==='csv') return makeCsv('nexo_iue.csv', headers, rows);
            openPrintableReport('Resumen IUE sobre utilidad', 'Cálculo 25% sobre utilidad proyectada', headers, rows, [{label:'Total IUE', value: toMoney(rows.reduce((a,r)=>a+Number(r[4]||0),0))}]);
        }

        function exportConciliation(format){
            const orders = filterOrdersByDates(getOrdersData());
            const headers = ['Fecha','Factura','Cliente','Método pago cliente','Total cobrado','Pago proveedor','Saldo neto NEXO','Saldo en bancos','Diferencia'];
            const rows = orders.map(o => {
                const total = Number(o.totals?.total ?? o.total ?? 0);
                const provider = Number(o.totals?.providerPayment ?? o.providerPayment ?? 0);
                const net = Number(o.totals?.netCommissionAfterTaxes ?? o.netCommissionAfterTaxes ?? 0);
                const bank = Number(o.totals?.bankBalance ?? o.bankBalance ?? net);
                return [new Date(o.timestamp||Date.now()).toLocaleDateString('es-BO'), o.id||'', o.customer?.fullName || o.fullName || '', (o.paymentMethod||'').toUpperCase(), total.toFixed(2), provider.toFixed(2), net.toFixed(2), bank.toFixed(2), (bank-net).toFixed(2)];
            });
            if(format==='csv') return makeCsv('nexo_conciliacion.csv', headers, rows);
            openPrintableReport('Conciliación Bancaria / Operativa', 'Cruce entre cobro cliente, pago proveedor y diferencia', headers, rows, [{label:'Total cobrado', value: toMoney(rows.reduce((a,r)=>a+Number(r[4]),0))}]);
        }

        // DATA BASE
        function getOrdersData() {
            const orders = JSON.parse(localStorage.getItem('nexoOrders') || '[]');
            if (orders.length) return orders;
            const last = JSON.parse(localStorage.getItem('nexoLastOrder') || '{}');
            return last && last.id ? [last] : [];
        }

        function toMoney(v) {
            return 'US$ ' + Number(v || 0).toFixed(2);
        }

        function makeCsv(filename, headers, rows) {
            const csv = [headers.join(',')].concat(
                rows.map(row => row.map(value => {
                    const safe = String(value ?? '').replace(/"/g, '""');
                    return `"${safe}"`;
                }).join(','))
            ).join('\\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }

        
        function openPrintableReport(title, subtitle, tableHeaders, tableRows, summaryRows = []) {
            const rowsHtml = tableRows.map(r => `<tr>${r.map(c => `<td style="padding:8px;border:1px solid #d9e2e1;">${c}</td>`).join('')}</tr>`).join('');
            const summaryHtml = summaryRows.length ? `<div style="margin-top:16px;">${summaryRows.map(s => `<div style="margin:4px 0;"><strong>${s.label}:</strong> ${s.value}</div>`).join('')}</div>` : '';
            const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title></head>
            <body style="font-family:Segoe UI,Arial,sans-serif;padding:28px;color:#2D3E3F;">
                <h1 style="margin:0 0 6px 0;color:#4A6B6D;">${title}</h1>
                <div style="margin-bottom:18px;color:#5A7C7E;">${subtitle}</div>
                <table style="border-collapse:collapse;width:100%;font-size:12px;">
                    <thead><tr>${tableHeaders.map(h => `<th style="padding:8px;border:1px solid #d9e2e1;background:#eef4f3;text-align:left;">${h}</th>`).join('')}</tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                ${summaryHtml}
            
<script>
// ===== NEXO ADMIN · DATOS REALES SUPABASE (clientes y pedidos) =====
const NEXO_DB_URL_REAL = "https://ujqbbnipftlzytdankwp.supabase.co";
const NEXO_DB_KEY_REAL = "sb_publishable_kUlixt-nOKZtvfYd0SYXdQ_44Y0NIYv";
let nexoAdminDbClient = null, nexoOrdersCache = [], nexoCustomersCache = [];
function getNexoAdminDb(){ if(!window.supabase || !window.supabase.createClient) throw new Error('Supabase JS no cargó'); if(!nexoAdminDbClient) nexoAdminDbClient = window.supabase.createClient(NEXO_DB_URL_REAL, NEXO_DB_KEY_REAL, {auth:{persistSession:false, autoRefreshToken:false}}); return nexoAdminDbClient; }
async function fetchNexoAdminData(){ const db=getNexoAdminDb(); const [o,c]=await Promise.all([db.from('pedidos').select('*').order('creado_en',{ascending:false}).limit(100), db.from('clientes').select('*').order('creado_en',{ascending:false}).limit(100)]); if(!o.error) nexoOrdersCache=o.data||[]; if(!c.error) nexoCustomersCache=c.data||[]; }
function moneyAdmin(v){ return 'US$ '+Number(v||0).toFixed(2); }
async function loadDashboard(){ try{await fetchNexoAdminData();}catch(e){console.warn(e);} const revenue=nexoOrdersCache.reduce((a,o)=>a+Number(o.total_cliente_usd||o.precio_usd||0),0); const pending=nexoOrdersCache.filter(o=>String(o.estado||'').toLowerCase().includes('pend')||String(o.estado_pago||'').toLowerCase().includes('pend')).length; const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;}; set('totalOrders',nexoOrdersCache.length); set('activeClients',nexoCustomersCache.length); set('totalRevenue',moneyAdmin(revenue)); set('pendingOrders',pending); }
async function loadOrders(){ const table=document.getElementById('ordersTable'); if(!table)return; table.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--gray);">Cargando pedidos reales...</td></tr>'; try{await fetchNexoAdminData();}catch(e){table.innerHTML='<tr><td colspan="6">Error cargando Supabase: '+e.message+'</td></tr>'; return;} if(!nexoOrdersCache.length){table.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--gray);">Sin pedidos reales registrados todavía.</td></tr>'; return;} table.innerHTML=nexoOrdersCache.map(o=>`<tr><td>${String(o.id||'').slice(0,8)}</td><td>${o.cliente_nombre||''} ${o.cliente_apellido||''}</td><td>${o.cliente_email||''}</td><td>${moneyAdmin(o.total_cliente_usd||o.precio_usd)}</td><td>${o.estado_pago||o.estado||'pendiente'}</td><td>${o.creado_en?new Date(o.creado_en).toLocaleDateString('es-BO'):'-'}</td></tr>`).join(''); }
async function renderCustomers(){ const tbody=document.getElementById('customersTable'); if(!tbody)return; tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--gray);">Cargando clientes reales...</td></tr>'; try{await fetchNexoAdminData();}catch(e){tbody.innerHTML='<tr><td colspan="5">Error cargando Supabase: '+e.message+'</td></tr>'; return;} if(!nexoCustomersCache.length){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--gray);">No hay clientes registrados</td></tr>'; return;} const counts={}; nexoOrdersCache.forEach(o=>{const em=(o.cliente_email||'').toLowerCase(); if(em)counts[em]=(counts[em]||0)+1;}); tbody.innerHTML=nexoCustomersCache.map(c=>`<tr><td>${c.nombre||''} ${c.apellido||''}</td><td>${c.email||''}</td><td>${c.codigo_area||''} ${c.telefono||''}</td><td>${c.pais||''}</td><td>${counts[(c.email||'').toLowerCase()]||0}</td></tr>`).join(''); }
async function renderPayments(){ const sec=document.getElementById('payments'); if(!sec)return; try{await fetchNexoAdminData();}catch(e){} const by={card:0,bank:0,paypal:0,payoneer:0}; nexoOrdersCache.forEach(o=>{const k=String(o.metodo_pago||'').toLowerCase(); if(k.includes('payoneer'))by.payoneer++; else if(k.includes('paypal'))by.paypal++; else if(k.includes('bank')||k.includes('transfer'))by.bank++; else if(k.includes('card')||k.includes('tarjeta'))by.card++;}); const cards=sec.querySelectorAll('.card-value'); if(cards.length>=4){cards[0].textContent=by.card; cards[1].textContent=by.bank; cards[2].textContent=by.paypal; cards[3].textContent=by.payoneer;} }
window.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{try{loadDashboard();}catch(e){}},500);});
