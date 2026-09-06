function addBitacoraCultural(laborData) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      var huertoId = assertHuertoExists_(laborData.ID_Huerto);
      var cultivo = laborData.ID_Cultivo ? assertCultivoDeHuerto_(huertoId, laborData.ID_Cultivo) : null;
      appendObjectRow_(getSpreadsheet().getSheetByName('BITACORA_CULTURAL'), {
        ID_Labor: 'LAB-' + Utilities.getUuid().slice(0, 8).toUpperCase(), ID_Huerto: huertoId,
        ID_Cultivo: cultivo ? cultivo.ID_Cultivo : '', Cultivo: cultivo ? cultivo.Nombre : '',
        Fecha: cleanDate_(laborData.Fecha, 'Fecha'), Tipo_Labor: cleanText_(laborData.Tipo_Labor, 'Tipo de labor', true),
        Descripcion_Tecnica: cleanText_(laborData.Descripcion_Tecnica, 'Descripción técnica', true), Horas_Invertidas: cleanNumber_(laborData.Horas_Invertidas, 'Horas invertidas', 0)
      });
      return { success: true, message: 'Labor cultural registrada correctamente.' };
    });
  } catch (error) {
    return { success: false, error: 'Error al guardar la labor cultural: ' + error.toString() };
  }
}
