function addBitacoraCultural(laborData) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      var huertoId = assertHuertoExists_(laborData.ID_Huerto);
      var cultivo = laborData.ID_Cultivo ? assertCultivoDeHuerto_(huertoId, laborData.ID_Cultivo) : null;
      var fecha = cleanDate_(laborData.Fecha, 'Fecha');
      var hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      var estado = fecha > hoy ? 'Programada' : 'Realizada';
      appendObjectRow_(getSpreadsheet().getSheetByName('BITACORA_CULTURAL'), {
        ID_Labor: 'LAB-' + Utilities.getUuid().slice(0, 8).toUpperCase(), ID_Huerto: huertoId,
        ID_Cultivo: cultivo ? cultivo.ID_Cultivo : '', Cultivo: cultivo ? cultivo.Nombre : '',
        Fecha: fecha, Tipo_Labor: cleanText_(laborData.Tipo_Labor, 'Tipo de labor', true),
        Descripcion_Tecnica: cleanText_(laborData.Descripcion_Tecnica, 'Descripción técnica', true), Horas_Invertidas: cleanNumber_(laborData.Horas_Invertidas, 'Horas invertidas', 0),
        Estado: estado, Fecha_Realizacion: estado === 'Realizada' ? fecha : ''
      });
      return { success: true, message: 'Labor cultural registrada correctamente.' };
    });
  } catch (error) {
    return { success: false, error: 'Error al guardar la labor cultural: ' + error.toString() };
  }
}

function completeBitacoraCultural(id) {
  return updateRecord_('BITACORA_CULTURAL', 'ID_Labor', id, {
    Estado: 'Realizada',
    Fecha_Realizacion: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  });
}

function reopenBitacoraCultural(id) {
  return updateRecord_('BITACORA_CULTURAL', 'ID_Labor', id, { Estado: 'Programada', Fecha_Realizacion: '' });
}
