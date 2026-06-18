# Checklist de pruebas SIAT - nexo

## 1. Configuración previa
- [ ] Sistema registrado en SIAT como propio.
- [ ] Modalidad seleccionada: Electrónica en Línea.
- [ ] Proceso masivo: Sí.
- [ ] Tipo documento sector: Factura Compra-Venta.
- [ ] CUIS obtenido.
- [ ] CUFD obtenido.
- [ ] Certificado/firma digital disponible.
- [ ] Ambiente piloto habilitado.

## 2. Prueba de cliente Bolivia
- [ ] Crear pedido de prueba con cliente Bolivia.
- [ ] Verificar NIT/CI real del cliente.
- [ ] Generar pre-factura BORRADOR.
- [ ] Revisar razón social, monto y descripción.
- [ ] Aprobar internamente para envío.
- [ ] Confirmar auditoría fiscal.

## 3. Prueba de cliente extranjero
- [ ] Crear pedido con país distinto a Bolivia.
- [ ] Confirmar que el sistema usa NIT/CI 99001.
- [ ] Generar BORRADOR fiscal.
- [ ] Aprobar internamente para envío.
- [ ] Verificar auditoría fiscal.

## 4. Prueba de registro IVA
- [ ] Confirmar que las facturas aprobadas se preparan para libro de ventas IVA.
- [ ] Exportar o visualizar periodo.
- [ ] Revisar totales y base de crédito fiscal.

## 5. Eventos significativos
- [ ] Registrar corte de internet.
- [ ] Verificar almacenamiento en siat_eventos_significativos.
- [ ] Confirmar trazabilidad en auditoría.

## 6. Pendiente para fase oficial
- [ ] Generación CUF.
- [ ] Generación XML oficial.
- [ ] Firma digital XML.
- [ ] QR oficial.
- [ ] Envío/recepción SIAT.
- [ ] Anulación real.
- [ ] Reenvío de contingencia.
