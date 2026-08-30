function addBitacoraFitosanitaria(fitoData) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      var calculation = calculateFitosanitario_(fitoData);
      getSpreadsheet().getSheetByName('BITACORA_FITOSANITARIA').appendRow([
        'FIT-' + Utilities.getUuid().slice(0, 8).toUpperCase(), assertHuertoExists_(fitoData.ID_Huerto),
        cleanDate_(fitoData.Fecha, 'Fecha'), cleanText_(fitoData.Problema_Objetivo, 'Problema objetivo', true),
        cleanText_(fitoData.Producto_Aplicado, 'Producto aplicado', true), cleanText_(fitoData.Dosis_Utilizada, 'Dosis utilizada', true),
        requireOption_(fitoData.Eficacia_Observada, ['En Seguimiento', 'Control Alto', 'Control Medio', 'Sin Respuesta'], 'Eficacia observada'),
        cleanSelectionList_(fitoData.Cultivos_Tratados, 'Cultivos o zonas tratadas'),
        calculation.surface, calculation.volumePer100, calculation.tankCapacity, calculation.dosePer100,
        calculation.unit, calculation.totalWater, calculation.loads, calculation.totalProduct
      ]);
      return { success: true, message: 'Registro fitosanitario guardado correctamente.' };
    });
  } catch (error) {
    return { success: false, error: 'Error al guardar el tratamiento fitosanitario: ' + error.toString() };
  }
}

function calculateFitosanitario_(data) {
  var surface = cleanNumber_(data.Superficie_Tratada_m2, 'Superficie tratada', 0.1);
  var volumePer100 = cleanNumber_(data.Volumen_100m2_L, 'Volumen por 100 m²', 0.1);
  var tankCapacity = cleanNumber_(data.Capacidad_Estanque_L, 'Capacidad del estanque', 0.1);
  var dosePer100 = cleanNumber_(data.Dosis_100L, 'Dosis por 100 litros', 0);
  var unit = requireOption_(data.Unidad_Producto, ['ml', 'g', 'L', 'kg'], 'Unidad del producto');
  var totalWater = Math.round((surface / 100 * volumePer100) * 100) / 100;
  var loads = Math.ceil(totalWater / tankCapacity * 100) / 100;
  var totalProduct = Math.round((totalWater / 100 * dosePer100) * 100) / 100;
  data.Dosis_Utilizada = dosePer100 + ' ' + unit + '/100 L · Total ' + totalProduct + ' ' + unit;
  return { surface: surface, volumePer100: volumePer100, tankCapacity: tankCapacity, dosePer100: dosePer100, unit: unit, totalWater: totalWater, loads: loads, totalProduct: totalProduct };
}

function cleanSelectionList_(value, field) {
  var items = Array.isArray(value) ? value : String(value || '').split(' · ');
  items = items.map(function(item) { return cleanText_(item, field, false); }).filter(String);
  if (!items.length) throw new Error('Seleccione al menos un cultivo o zona tratada.');
  return items.filter(function(item, index) { return items.indexOf(item) === index; }).join(' · ');
}
