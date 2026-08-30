function addBitacoraFitosanitaria(fitoData) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      getSpreadsheet().getSheetByName('BITACORA_FITOSANITARIA').appendRow([
        'FIT-' + Utilities.getUuid().slice(0, 8).toUpperCase(), assertHuertoExists_(fitoData.ID_Huerto),
        cleanDate_(fitoData.Fecha, 'Fecha'), cleanText_(fitoData.Problema_Objetivo, 'Problema objetivo', true),
        cleanText_(fitoData.Producto_Aplicado, 'Producto aplicado', true), cleanText_(fitoData.Dosis_Utilizada, 'Dosis utilizada', true),
        requireOption_(fitoData.Eficacia_Observada, ['En Seguimiento', 'Control Alto', 'Control Medio', 'Sin Respuesta'], 'Eficacia observada'),
        cleanSelectionList_(fitoData.Cultivos_Tratados, 'Cultivos o zonas tratadas')
      ]);
      return { success: true, message: 'Registro fitosanitario guardado correctamente.' };
    });
  } catch (error) {
    return { success: false, error: 'Error al guardar el tratamiento fitosanitario: ' + error.toString() };
  }
}

function cleanSelectionList_(value, field) {
  var items = Array.isArray(value) ? value : String(value || '').split(' · ');
  items = items.map(function(item) { return cleanText_(item, field, false); }).filter(String);
  if (!items.length) throw new Error('Seleccione al menos un cultivo o zona tratada.');
  return items.filter(function(item, index) { return items.indexOf(item) === index; }).join(' · ');
}
