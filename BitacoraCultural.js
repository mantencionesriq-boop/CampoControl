function addBitacoraCultural(laborData) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      getSpreadsheet().getSheetByName('BITACORA_CULTURAL').appendRow([
        'LAB-' + Utilities.getUuid().slice(0, 8).toUpperCase(), assertHuertoExists_(laborData.ID_Huerto),
        cleanDate_(laborData.Fecha, 'Fecha'), cleanText_(laborData.Tipo_Labor, 'Tipo de labor', true),
        cleanText_(laborData.Descripcion_Tecnica, 'Descripción técnica', true), cleanNumber_(laborData.Horas_Invertidas, 'Horas invertidas', 0)
      ]);
      return { success: true, message: 'Labor cultural registrada correctamente.' };
    });
  } catch (error) {
    return { success: false, error: 'Error al guardar la labor cultural: ' + error.toString() };
  }
}
