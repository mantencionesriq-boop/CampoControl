function addBitacoraFitosanitaria(fitoData) {
  try {
    setupDatabase();
    validateSuperficieTratada_(fitoData);
    getSpreadsheet().getSheetByName('BITACORA_FITOSANITARIA').appendRow(['FIT-' + Utilities.getUuid().slice(0, 8).toUpperCase(), fitoData.ID_Huerto, fitoData.Fecha, fitoData.Problema_Objetivo, fitoData.Producto_Aplicado, fitoData.Dosis_Utilizada, fitoData.Eficacia_Observada, fitoData.Superficie_Tratada_m2, fitoData.Tipo_Aplicacion]);
    return { success: true, message: 'Registro fitosanitario guardado correctamente.' };
  } catch (error) {
    return { success: false, error: 'Error al guardar el tratamiento fitosanitario: ' + error.toString() };
  }
}

function validateSuperficieTratada_(fitoData) {
  var huertos = getSheetDataAsObjects(getSpreadsheet().getSheetByName('HUERTOS'));
  var huerto = huertos.filter(function(item) { return String(item.ID_Huerto) === String(fitoData.ID_Huerto); })[0];
  if (!huerto) throw new Error('No se encontró el huerto seleccionado.');
  var maximo = Number(String(huerto.Superficie_m2).replace(',', '.'));
  var tratada = Number(fitoData.Superficie_Tratada_m2);
  if (!isFinite(tratada) || tratada <= 0) throw new Error('Indique una superficie tratada válida.');
  if (!isFinite(maximo) || maximo <= 0) throw new Error('El huerto no tiene una superficie máxima válida.');
  if (tratada > maximo) throw new Error('La superficie tratada no puede superar los ' + maximo + ' m² del huerto.');
}
