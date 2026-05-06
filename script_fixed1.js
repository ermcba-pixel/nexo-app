
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
            
</body></html>`;
            const w = window.open('', '_blank');
            if (!w) return;
            w.document.write(html);
            w.document.close();
            w.focus();
            w.print();
        }

        function getCompanyInfoForReports() {
            return JSON.parse(localStorage.getItem('nexoCompanyInfo') || '{}');
        }

        function exportTaxTemplate(format) {
            const company = getCompanyInfoForReports();
            const headers = ['Campo', 'Valor'];
            const rows = [
                ['Razón Social', company.socialName || 'NEXO'],
                ['NIT', company.nit || '774651015'],
                ['Propietario', company.owner || 'EDUARDO RODRIGUEZ MARTINEZ'],
                ['Correo operativo PayPal', 'ermcba@hotmail.com'],
                ['Concepto tributario', 'Servicios de Intermediación / Comercialización Internacional'],
                ['IT aplicado', '3% sobre comisión'],
                ['IUE aplicado', '25% sobre utilidad'],
                ['Comisión nexo', '30%'],
                ['Moneda operativa', 'USD'],
                ['Tipo de cambio referencia', String(company.exchangeRate || 6.96)]
            ];
            if (format === 'csv') return makeCsv('nexo_plantilla_tributaria.csv', headers, rows);
            openPrintableReport('Plantilla Tributaria NEXO', 'Base operativa para Impuestos Nacionales', headers, rows);
        }

        function exportSalesBook(format) {
            const orders = getOrdersData();
            const headers = ['Fecha', 'Factura', 'Cliente', 'Correo', 'Producto subtotal', 'Envío', 'Gastos vendedor', 'Comisión 30%', 'IT 3%', 'IUE 25%', 'Total cobrado'];
            const rows = orders.map(o => [
                new Date(o.timestamp || Date.now()).toLocaleDateString('es-BO'),
                o.id || '',
                o.customer?.fullName || o.fullName || '',
                o.customer?.email || o.email || '',
                Number(o.totals?.subtotal ?? o.subtotal ?? 0).toFixed(2),
                Number(o.totals?.amazonShipping ?? o.amazonShipping ?? 0).toFixed(2),
                Number(o.totals?.vendorFees ?? o.vendorFees ?? 0).toFixed(2),
                Number(o.totals?.commission ?? o.commission ?? 0).toFixed(2),
                Number(o.totals?.itf ?? o.itf ?? 0).toFixed(2),
                Number(o.totals?.iue ?? o.iue ?? 0).toFixed(2),
                Number(o.totals?.total ?? o.total ?? 0).toFixed(2)
            ]);
            if (format === 'csv') return makeCsv('nexo_libro_ventas.csv', headers, rows);
            openPrintableReport('Libro de Ventas - NEXO', 'Operaciones registradas para control tributario y gerencial', headers, rows);
        }

        function exportITReport(format) {
            const orders = getOrdersData();
            const headers = ['Fecha', 'Factura', 'Base comisión', 'IT 3%'];
            const rows = orders.map(o => [
                new Date(o.timestamp || Date.now()).toLocaleDateString('es-BO'),
                o.id || '',
                Number(o.totals?.commission ?? o.commission ?? 0).toFixed(2),
                Number(o.totals?.itf ?? o.itf ?? 0).toFixed(2)
            ]);
            const totalIT = orders.reduce((acc, o) => acc + Number(o.totals?.itf ?? o.itf ?? 0), 0);
            if (format === 'csv') return makeCsv('nexo_reporte_it.csv', headers, rows.concat([['TOTAL', '', '', totalIT.toFixed(2)]]));
            openPrintableReport('Reporte IT - NEXO', 'IT calculado sobre comisión de intermediación', headers, rows, [{label:'IT total periodo', value: toMoney(totalIT)}]);
        }

        function exportIUEReport(format) {
            const orders = getOrdersData();
            const headers = ['Fecha', 'Factura', 'Base comisión', 'IUE 25%'];
            const rows = orders.map(o => [
                new Date(o.timestamp || Date.now()).toLocaleDateString('es-BO'),
                o.id || '',
                Number(o.totals?.commission ?? o.commission ?? 0).toFixed(2),
                Number(o.totals?.iue ?? o.iue ?? 0).toFixed(2)
            ]);
            const totalIUE = orders.reduce((acc, o) => acc + Number(o.totals?.iue ?? o.iue ?? 0), 0);
            if (format === 'csv') return makeCsv('nexo_reporte_iue.csv', headers, rows.concat([['TOTAL', '', '', totalIUE.toFixed(2)]]));
            openPrintableReport('Reporte IUE - NEXO', 'IUE proyectado sobre utilidad/comisión', headers, rows, [{label:'IUE total periodo', value: toMoney(totalIUE)}]);
        }

        function exportReconciliation(format) {
            const orders = getOrdersData();
            const headers = ['Fecha', 'Factura', 'Cliente', 'Método de pago', 'Correo PayPal', 'Total cobrado', 'Comisión neta después impuestos'];
            const rows = orders.map(o => [
                new Date(o.timestamp || Date.now()).toLocaleDateString('es-BO'),
                o.id || '',
                o.customer?.fullName || o.fullName || '',
                (o.paymentMethod || '').toUpperCase(),
                o.paypalEmail || 'ermcba@hotmail.com',
                Number(o.totals?.total ?? o.total ?? 0).toFixed(2),
                Number(o.totals?.netCommissionAfterTaxes ?? o.netCommissionAfterTaxes ?? 0).toFixed(2)
            ]);
            if (format === 'csv') return makeCsv('nexo_conciliacion.csv', headers, rows);
            openPrintableReport('Conciliación de Cobros - NEXO', 'Control de cobros y comisión neta', headers, rows);
        }

        function exportExchangeControl(format) {
            const company = getCompanyInfoForReports();
            const tc = Number(company.exchangeRate || 6.96).toFixed(2);
            const orders = getOrdersData();
            const headers = ['Fecha', 'Factura', 'Moneda', 'Tipo de cambio referencia', 'Total USD', 'Equivalente BOB'];
            const rows = orders.map(o => {
                const usd = Number(o.totals?.total ?? o.total ?? 0);
                return [
                    new Date(o.timestamp || Date.now()).toLocaleDateString('es-BO'),
                    o.id || '',
                    o.currency || 'USD',
                    tc,
                    usd.toFixed(2),
                    (usd * Number(tc)).toFixed(2)
                ];
            });
            if (format === 'csv') return makeCsv('nexo_control_tipo_cambio.csv', headers, rows);
            openPrintableReport('Control Diario de Tipo de Cambio', 'Control referencial para reportes en Bolivia', headers, rows);
        }

        function exportManagerReport(format) {
            const orders = getOrdersData();
            const headers = ['Factura', 'Cliente', 'Comisión', 'IT', 'IUE', 'Comisión neta', 'Total cobrado'];
            const rows = orders.map(o => [
                o.id || '',
                o.customer?.fullName || o.fullName || '',
                Number(o.totals?.commission ?? o.commission ?? 0).toFixed(2),
                Number(o.totals?.itf ?? o.itf ?? 0).toFixed(2),
                Number(o.totals?.iue ?? o.iue ?? 0).toFixed(2),
                Number(o.totals?.netCommissionAfterTaxes ?? o.netCommissionAfterTaxes ?? 0).toFixed(2),
                Number(o.totals?.total ?? o.total ?? 0).toFixed(2)
            ]);
            const totalNet = orders.reduce((acc, o) => acc + Number(o.totals?.netCommissionAfterTaxes ?? o.netCommissionAfterTaxes ?? 0), 0);
            if (format === 'csv') return makeCsv('nexo_reporte_gerencial_margen.csv', headers, rows.concat([['TOTAL','','','','', totalNet.toFixed(2), '']]));
            openPrintableReport('Reporte Gerencial de Margen', 'Margen neto de intermediación luego de impuestos', headers, rows, [{label:'Comisión neta acumulada', value: toMoney(totalNet)}]);
        }

        // CARGAR DASHBOARD
        function loadDashboard() {
            const orders = getOrdersData();
            const revenue = orders.reduce((acc, o) => acc + Number(o.totals?.total ?? o.total ?? 0), 0);
            const clients = new Set(orders.map(o => (o.customer?.email || o.email || '').toLowerCase()).filter(Boolean)).size;
            document.getElementById('totalOrders').textContent = String(orders.length);
            document.getElementById('activeClients').textContent = String(clients || 0);
            document.getElementById('totalRevenue').textContent = toMoney(revenue);
            document.getElementById('pendingOrders').textContent = String(orders.length);
        }

        // CARGAR ÓRDENES
        function loadOrders() {
            const orders = getOrdersData();
            const table = document.getElementById('ordersTable');
            if (!orders.length) {
                table.innerHTML = '<tr><td colspan="6">Sin órdenes registradas todavía.</td></tr>';
                return;
            }
            table.innerHTML = orders.map(orderData => `
                <tr>
                    <td>${orderData.id || ''}</td>
                    <td>${orderData.customer?.fullName || orderData.fullName || ''}</td>
                    <td>${orderData.customer?.email || orderData.email || ''}</td>
                    <td>US$ ${Number(orderData.totals?.total ?? orderData.total ?? 0).toFixed(2)}</td>
                    <td>✅ Pagado</td>
                    <td>${new Date(orderData.timestamp || Date.now()).toLocaleDateString('es-ES')}</td>
                </tr>
            `).join('');
        }

        // GUARDAR INFORMACIÓN DE LA EMPRESA
        function saveCompanyInfo() {
            const companyInfo = {
                name: document.getElementById('editCompanyName').value,
                socialName: document.getElementById('editCompanySocialName').value,
                nit: document.getElementById('editCompanyNIT').value,
                owner: document.getElementById('editCompanyOwner').value,
                email: document.getElementById('editCompanyEmail').value,
                address: document.getElementById('editCompanyAddress').value,
                city: document.getElementById('editCompanyCity').value,
                country: document.getElementById('editCompanyCountry').value,
                regimen: document.getElementById('editCompanyRegimen').value,
                itf: parseFloat(document.getElementById('editCompanyITF').value),
                iue: parseFloat(document.getElementById('editCompanyIUE').value),
                commission: parseFloat(document.getElementById('editCompanyCommission').value),
                rf: parseFloat(document.getElementById('editCompanyRF').value),
                exchangeRate: parseFloat(document.getElementById('editExchangeRate').value),
                description: document.getElementById('editCompanyDescription').value
            };

            localStorage.setItem('nexoCompanyInfo', JSON.stringify(companyInfo));
            localStorage.setItem('nexoCommission', String(companyInfo.commission));

            document.getElementById('companyName').textContent = companyInfo.name;
            document.getElementById('companySocialName').textContent = companyInfo.socialName;
            document.getElementById('companyOwner').textContent = companyInfo.owner;
            document.getElementById('companyITF').textContent = companyInfo.itf + '%';
            document.getElementById('companyIUE').textContent = companyInfo.iue + '%';
            const companyCommissionEl = document.getElementById('companyCommission');
            if(companyCommissionEl) companyCommissionEl.textContent = companyInfo.commission + '%';

            alert('✅ Información de la empresa guardada correctamente');
        }

        function resetCompanyInfo() {
            document.getElementById('editCompanyName').value = 'NEXO';
            document.getElementById('editCompanySocialName').value = 'NEXO';
            document.getElementById('editCompanyNIT').value = '774651015';
            document.getElementById('editCompanyOwner').value = 'EDUARDO RODRIGUEZ MARTINEZ';
            document.getElementById('editCompanyEmail').value = 'ermcba@hotmail.com';
            document.getElementById('editCompanyAddress').value = 'Avenida America 435, Edificio Jaque, Piso 4 Oficina 9';
            document.getElementById('editCompanyCity').value = 'Cochabamba';
            document.getElementById('editCompanyCountry').value = 'Bolivia';
            document.getElementById('editCompanyCommission').value = '30';
            document.getElementById('editCompanyDescription').value = 'NEXO es una plataforma intermediaria B2C global que conecta con Amazon y CJ Dropshipping para ofrecer productos a 196 países con comisión del 30%.';
        }

        
        function loadCompanyInfo() {
            const raw = localStorage.getItem('nexoCompanyInfo');
            if (!raw) return;
            try {
                const companyInfo = JSON.parse(raw);
                if (companyInfo.name) document.getElementById('companyName').textContent = companyInfo.name;
                if (companyInfo.socialName) document.getElementById('companySocialName').textContent = companyInfo.socialName;
                if (companyInfo.owner) document.getElementById('companyOwner').textContent = companyInfo.owner;
                if (typeof companyInfo.itf === 'number') document.getElementById('companyITF').textContent = companyInfo.itf + '%';
                if (typeof companyInfo.iue === 'number') document.getElementById('companyIUE').textContent = companyInfo.iue + '%';
                if (typeof companyInfo.commission === 'number') {
                    const companyCommissionEl = document.getElementById('companyCommission');
                    if (companyCommissionEl) companyCommissionEl.textContent = companyInfo.commission + '%';
                    const editCommissionEl = document.getElementById('editCompanyCommission');
                    if (editCommissionEl) editCommissionEl.value = companyInfo.commission;
                    const avgCommissionEl = document.getElementById('avgCommission');
                    if (avgCommissionEl) avgCommissionEl.textContent = companyInfo.commission + '%';
                }
                if (typeof companyInfo.exchangeRate === 'number') document.getElementById('companyExchangeRate').textContent = companyInfo.exchangeRate.toFixed(2) + ' BOB/USD';
                if (companyInfo.regimen) document.getElementById('companyRegimen').textContent = companyInfo.regimen;
                if (companyInfo.name) document.getElementById('editCompanyName').value = companyInfo.name;
                if (companyInfo.socialName) document.getElementById('editCompanySocialName').value = companyInfo.socialName;
                if (companyInfo.nit) document.getElementById('editCompanyNIT').value = companyInfo.nit;
                if (companyInfo.owner) document.getElementById('editCompanyOwner').value = companyInfo.owner;
                if (companyInfo.email) document.getElementById('editCompanyEmail').value = companyInfo.email;
                if (companyInfo.address) document.getElementById('editCompanyAddress').value = companyInfo.address;
                if (companyInfo.city) document.getElementById('editCompanyCity').value = companyInfo.city;
                if (companyInfo.country) document.getElementById('editCompanyCountry').value = companyInfo.country;
                if (companyInfo.regimen) document.getElementById('editCompanyRegimen').value = companyInfo.regimen;
                if (typeof companyInfo.itf === 'number') document.getElementById('editCompanyITF').value = companyInfo.itf;
                if (typeof companyInfo.iue === 'number') document.getElementById('editCompanyIUE').value = companyInfo.iue;
                if (typeof companyInfo.rf === 'number') document.getElementById('editCompanyRF').value = companyInfo.rf;
                if (typeof companyInfo.exchangeRate === 'number') document.getElementById('editExchangeRate').value = companyInfo.exchangeRate;
                if (companyInfo.description) document.getElementById('editCompanyDescription').value = companyInfo.description;
            } catch (e) {
                console.error('Error cargando datos de empresa', e);
            }
        }


        // ===== TICKETS SOPORTE · SUPABASE JS UMD CORREGIDO =====
        const NEXO_SUPABASE_URL = "https://ujqbbnipftlzytdankwp.supabase.co";
        const NEXO_SUPABASE_KEY = "sb_publishable_kUlixt-nOKZtvfYd0SYXdQ_44Y0NIYv";
        let nexoTicketsCache = [];
        let nexoSupabaseClient = null;

        function getNexoSupabaseClient(){
            if (!window.supabase || !window.supabase.createClient) {
                throw new Error("No cargó la librería Supabase JS. Revise conexión a internet o CDN.");
            }
            if (!nexoSupabaseClient) {
                nexoSupabaseClient = window.supabase.createClient(NEXO_SUPABASE_URL, NEXO_SUPABASE_KEY, {
                    auth: { persistSession: false, autoRefreshToken: false }
                });
            }
            return nexoSupabaseClient;
        }

        function ticketSafe(v){
            return String(v == null ? '' : v).replace(/[&<>"']/g, function(m){
                return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
            });
        }

        function getTicketChannel(t){
            const text = `${t.mensaje || ''} ${t.asunto || ''} ${t.tipo_reclamo || ''}`.toLowerCase();
            if(text.includes('whatsapp')) return 'WhatsApp';
            if(text.includes('llamada') || text.includes('telefono') || text.includes('teléfono')) return 'Llamada';
            if(text.includes('chat')) return 'Chat web';
            return 'Correo';
        }

        async function loadTickets() {
            const table = document.getElementById('ticketsTable');
            const search = document.getElementById('ticketSearch');
            if (search && search.value === 'ermcba@gmail.com') search.value = '';
            if (!table) return;

            table.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray);font-weight:700;">Cargando tickets desde Supabase...</td></tr>';

            try {
                const client = getNexoSupabaseClient();
                const { data, error } = await client
                    .from('tickets')
                    .select('*')
                    .order('fecha_creacion', { ascending: false });

                if (error) throw error;

                nexoTicketsCache = data || [];
                renderTicketsTable();
            } catch (err) {
                table.innerHTML =
                    '<tr><td colspan="7" style="text-align:center;color:#E74C3C;font-weight:700;">' +
                    'No se pudo cargar desde Supabase.<br>' +
                    'Detalle técnico: ' + ticketSafe(err.message || err) + '<br><br>' +
                    'Si el ticket sí está en Supabase, revise que Vercel haya publicado este archivo nuevo y presione Ctrl + F5.' +
                    '</td></tr>';
            }
        }

        function renderTicketsTable() {
            const table = document.getElementById('ticketsTable');
            if (!table) return;

            const q = (document.getElementById('ticketSearch')?.value || '').toLowerCase().trim();
            const estado = document.getElementById('ticketStatusFilter')?.value || '';

            let rows = (nexoTicketsCache || []).filter(function(t){
                const channel = getTicketChannel(t);
                const text = `${t.nombre_cliente || ''} ${t.email || ''} ${t.asunto || ''} ${t.tipo_reclamo || ''} ${t.mensaje || ''} ${channel}`.toLowerCase();
                const okSearch = !q || text.includes(q);
                const okEstado = !estado || (t.estado || 'Nuevo') === estado;
                return okSearch && okEstado;
            });

            if (!rows.length) {
                table.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray);font-weight:700;">No hay tickets para mostrar.</td></tr>';
                return;
            }

            table.innerHTML = rows.map(function(t, idx){
                const fecha = t.fecha_creacion ? new Date(t.fecha_creacion).toLocaleString('es-BO') : '';
                const channel = getTicketChannel(t);
                return `
                    <tr>
                        <td>${ticketSafe(fecha)}</td>
                        <td>${ticketSafe(t.nombre_cliente || '')}</td>
                        <td>${ticketSafe(t.asunto || '')}</td>
                        <td>${ticketSafe(t.tipo_reclamo || '')}</td>
                        <td><span class="ticket-pill">${ticketSafe(t.estado || 'Nuevo')}</span></td>
                        <td>${ticketSafe(t.prioridad || 'Media')}</td>
                        <td><button class="ticket-response-btn" onclick="openTicketDetail(${idx})">Responder por ${ticketSafe(channel)}</button></td>
                    </tr>
                `;
            }).join('');
        }

        function openTicketDetail(index){
            const t = nexoTicketsCache[index];
            if(!t) return;
            const box = document.getElementById('ticketDetailBox');
            const content = document.getElementById('ticketDetailContent');
            const channel = getTicketChannel(t);
            const subject = encodeURIComponent('Respuesta ticket nexo™ - ' + (t.asunto || 'Soporte'));
            const body = encodeURIComponent('Estimado/a ' + (t.nombre_cliente || '') + ',\n\nEn atención a su ticket de soporte, le informamos lo siguiente:\n\n');
            const mailto = 'mailto:' + (t.email || '') + '?subject=' + subject + '&body=' + body;

            if(box) box.style.display = 'block';
            if(content){
                content.innerHTML = `
                    <div class="ticket-detail-grid">
                        <div><span class="info-label">Cliente</span><div class="info-value highlight">${ticketSafe(t.nombre_cliente || '')}</div></div>
                        <div><span class="info-label">Canal solicitado</span><div class="info-value highlight">${ticketSafe(channel)}</div></div>
                        <div><span class="info-label">Correo</span><div class="info-value">${ticketSafe(t.email || '')}</div></div>
                        <div><span class="info-label">Prioridad</span><div class="info-value">${ticketSafe(t.prioridad || 'Media')}</div></div>
                        <div><span class="info-label">Estado</span><div class="info-value">${ticketSafe(t.estado || 'Nuevo')}</div></div>
                        <div><span class="info-label">Tipo</span><div class="info-value">${ticketSafe(t.tipo_reclamo || '')}</div></div>
                    </div>
                    <div class="ticket-message">${ticketSafe(t.mensaje || '')}</div>
                    <div class="button-group">
                        <button class="btn btn-primary" onclick="window.location.href='${mailto}'">Responder</button>
                        <button class="btn btn-secondary" onclick="alert('Canal solicitado por el cliente: ${ticketSafe(channel)}')">Canal solicitado</button>
                    </div>
                `;
                box.scrollIntoView({behavior:'smooth', block:'start'});
            }
        }

        
        function logout() {
            if (confirm('¿Deseas cerrar sesión?')) {
                window.location.href = 'nexo-admin-login.html';
            }
        }

        loadCompanyInfo();
        loadDashboard();
        renderCustomers();
        renderPayments();
        renderShipments();
        renderProducts();
        renderUsers();
        applyReportFilters();
    