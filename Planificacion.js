function saveLaborProgramada(data) {
  try {
    setupDatabase();
    var estado = requireOption_(data.Estado || 'Programada', ['Programada', 'Realizada'], 'Estado');
    var fechaRealizacion = estado === 'Realizada'
      ? cleanDate_(data.Fecha_Realizacion || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'), 'Fecha de realización')
      : '';
    data.Estado = estado;
    data.Fecha_Realizacion = fechaRealizacion;
    if (data.ID_Programacion) {
      return updateRecord_('LABORES_PROGRAMADAS', 'ID_Programacion', data.ID_Programacion, data);
    }
    return withDocumentLock_(function() {
      getSpreadsheet().getSheetByName('LABORES_PROGRAMADAS').appendRow([
        'PRG-' + Utilities.getUuid().slice(0, 8).toUpperCase(), assertHuertoExists_(data.ID_Huerto),
        cleanDate_(data.Fecha_Programada, 'Fecha programada'), cleanText_(data.Tipo_Labor, 'Tipo de labor', true),
        cleanText_(data.Descripcion, 'Detalle', false), cleanNumber_(data.Horas_Estimadas, 'Horas estimadas', 0),
        estado, fechaRealizacion
      ]);
      return { success: true, message: 'Labor programada correctamente.' };
    });
  } catch (error) {
    return { success: false, error: 'Error al programar la labor: ' + error.toString() };
  }
}

function completeLaborProgramada(id) {
  return updateRecord_('LABORES_PROGRAMADAS', 'ID_Programacion', id, {
    Estado: 'Realizada',
    Fecha_Realizacion: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  });
}

function reopenLaborProgramada(id) {
  return updateRecord_('LABORES_PROGRAMADAS', 'ID_Programacion', id, { Estado: 'Programada', Fecha_Realizacion: '' });
}

function deleteLaborProgramada(id) {
  return deleteRecord_('LABORES_PROGRAMADAS', 'ID_Programacion', id);
}
