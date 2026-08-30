function addBitacoraFitosanitaria(fitoData) {
  try {
    setupDatabase();
    getSpreadsheet().getSheetByName('BITACORA_FITOSANITARIA').appendRow(['FIT-' + Utilities.getUuid().slice(0, 8).toUpperCase(), fitoData.ID_Huerto, fitoData.Fecha, fitoData.Problema_Objetivo, fitoData.Producto_Aplicado, fitoData.Dosis_Utilizada, fitoData.Eficacia_Observada]);
    return { success: true, message: 'Registro fitosanitario guardado correctamente.' };
  } catch (error) {
    return { success: false, error: 'Error al guardar el tratamiento fitosanitario: ' + error.toString() };
  }
}
