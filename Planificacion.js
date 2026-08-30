function saveLaborProgramada(data) {
  try {
    setupDatabase();
    if (data.ID_Programacion) {
      return updateRecord_('LABORES_PROGRAMADAS', 'ID_Programacion', data.ID_Programacion, data);
    }
    getSpreadsheet().getSheetByName('LABORES_PROGRAMADAS').appendRow([
      'PRG-' + Utilities.getUuid().slice(0, 8).toUpperCase(), data.ID_Huerto,
      data.Fecha_Programada, data.Tipo_Labor, data.Descripcion,
      data.Horas_Estimadas, 'Programada', ''
    ]);
    return { success: true, message: 'Labor programada correctamente.' };
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

function deleteLaborProgramada(id) {
  return deleteRecord_('LABORES_PROGRAMADAS', 'ID_Programacion', id);
}
