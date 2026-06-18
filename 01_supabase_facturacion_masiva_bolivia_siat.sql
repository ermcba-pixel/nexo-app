# nexo - Paquete de homologación SIAT Bolivia

## Estado del paquete
Este ZIP es para preparar y demostrar el flujo de pruebas internas de facturación electrónica en línea de nexo, en ambiente PILOTO/BORRADOR.

No realiza envío real al SIAT hasta que Impuestos habilite y confirme:
- CUIS
- CUFD
- Certificado/firma digital
- Ambiente de homologación autorizado
- Credenciales/endpoint oficial correspondiente

## Datos base del sistema
- Software: nexo
- Versión: 1.0.1
- Tipo de sistema: Propio
- Modalidad: Facturación Electrónica en Línea
- Proceso masivo: Sí
- Registro de compras: No
- NIT emisor: 774651015
- Razón social: EDUARDO RODRIGUEZ MARTINEZ
- Ambiente actual: PILOTO

## Flujo de trabajo implementado
1. Pedido pagado o confirmado.
2. Creación de pre-factura fiscal en estado BORRADOR.
3. Revisión manual de cliente, NIT/CI, país, monto, concepto y moneda.
4. Aprobación interna para envío SIAT, quedando en estado PENDIENTE_ENVIO.
5. Registro de auditoría fiscal por cada acción.
6. Preparación para Registro IVA y respaldo XML/PDF/QR.

## Regla fiscal del cliente
- Cliente Bolivia: usar NIT/CI del cliente.
- Cliente extranjero/no residente: usar NIT/CI 99001.

## Tablas Supabase SIAT usadas
- siat_configuracion
- siat_catalogos
- siat_clientes_fiscales
- siat_facturas
- siat_factura_items
- siat_registro_ventas_iva
- siat_eventos_significativos
- siat_contingencias
- siat_auditoria_fiscal
- siat_cierres_fiscales
- siat_facturacion_masiva_lotes
- siat_facturacion_masiva_lote_items

## Módulos del panel
Panel administrativo: `nexo-admin-panel.html`

Menú: Impuestos SIAT
- Configuración SIAT
- Facturación Masiva
- Facturas Emitidas
- Registro IVA
- Eventos Significativos
- Auditoría Fiscal

## APIs internas incluidas
- `/api/siat-admin-data.js`: consulta configuración, catálogos, facturas, IVA, eventos y auditoría.
- `/api/siat-actions.js`: crea pre-facturas BORRADOR, aprueba para envío interno y registra eventos significativos.

## Variables de entorno necesarias en Vercel
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY

Para producción SIAT se deberán añadir las variables oficiales que entregue/autorice Impuestos.

## Importante
Este paquete no debe declararse como sistema autorizado aún. Sirve para pruebas internas, homologación inicial y preparación técnica. La emisión real solo debe activarse después de aprobación SIAT.
