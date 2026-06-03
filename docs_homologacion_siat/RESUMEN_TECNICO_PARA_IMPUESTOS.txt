RESUMEN TÉCNICO - nexo v1.0.1

Sistema propio para Facturación Electrónica en Línea y proceso masivo.

El sistema administra pedidos, clientes, pagos y pre-facturación fiscal. Para la etapa piloto genera facturas internas en estado BORRADOR/PENDIENTE_ENVIO, registra auditoría fiscal y prepara respaldo tributario.

Base de datos: Supabase PostgreSQL.
Panel: nexo-admin-panel.html.
APIs: Vercel Serverless Functions.

Regla fiscal implementada:
- Bolivia: NIT/CI del cliente.
- Exterior: 99001.

El envío real a SIAT se activará cuando el contribuyente cuente con CUIS, CUFD, certificado/firma digital y autorización de homologación.
