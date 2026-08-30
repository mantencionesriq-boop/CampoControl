function updateHuerto(data) {
  return updateRecord_('HUERTOS', 'ID_Huerto', data.ID_Huerto, data);
}

function updateBitacoraCultural(data) {
  return updateRecord_('BITACORA_CULTURAL', 'ID_Labor', data.ID_Labor, data);
}

function updateBitacoraFitosanitaria(data) {
  return updateRecord_('BITACORA_FITOSANITARIA', 'ID_Aplicacion', data.ID_Aplicacion, data);
}

function updateRecord_(sheetName, idColumn, id, data) {
  try {
    var sheet = getSpreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error('No existe la hoja ' + sheetName);
    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    var idIndex = headers.indexOf(idColumn);
    for (var rowIndex = 1; rowIndex < values.length; rowIndex++) {
      if (String(values[rowIndex][idIndex]) !== String(id)) continue;
      headers.forEach(function(header, columnIndex) {
        if (Object.prototype.hasOwnProperty.call(data, header)) {
          sheet.getRange(rowIndex + 1, columnIndex + 1).setValue(data[header]);
        }
      });
      return { success: true, message: 'Registro actualizado correctamente.' };
    }
    throw new Error('No se encontró el registro solicitado.');
  } catch (error) {
    return { success: false, error: 'Error al actualizar: ' + error.toString() };
  }
}
