function addBitacoraCultural(laborData) {
  try {
    setupDatabase();
    getSpreadsheet().getSheetByName('BITACORA_CULTURAL').appendRow(['LAB-' + Utilities.getUuid().slice(0, 8).toUpperCase(), laborData.ID_Huerto, laborData.Fecha, laborData.Tipo_Labor, laborData.Descripcion_Tecnica, laborData.Horas_Invertidas]);
    return { success: true, message: 'Labor cultural registrada correctamente.' };
  } catch (error) {
    return { success: false, error: 'Error al guardar la labor cultural: ' + error.toString() };
  }
}
