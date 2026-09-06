function updateHuerto(data) {
  return updateRecord_('HUERTOS', 'ID_Huerto', data.ID_Huerto, data);
}

function updateBitacoraCultural(data) {
  return updateRecord_('BITACORA_CULTURAL', 'ID_Labor', data.ID_Labor, data);
}

function deleteBitacoraCultural(id) {
  return deleteRecord_('BITACORA_CULTURAL', 'ID_Labor', id);
}

function updateBitacoraFitosanitaria(data) {
  return saveBitacoraFitosanitaria_(data, true);
}

function deleteBitacoraFitosanitaria(id) {
  return deleteRecord_('BITACORA_FITOSANITARIA', 'ID_Aplicacion', id);
}

function updateRecord_(sheetName, idColumn, id, data) {
  try {
    return withDocumentLock_(function() {
      var sheet = getSpreadsheet().getSheetByName(sheetName);
      if (!sheet) throw new Error('No existe la hoja ' + sheetName);
      var values = sheet.getDataRange().getValues();
      var headers = values[0];
      var idIndex = headers.indexOf(idColumn);
      if (idIndex === -1) throw new Error('No existe la columna identificadora.');
      for (var rowIndex = 1; rowIndex < values.length; rowIndex++) {
        if (String(values[rowIndex][idIndex]) !== String(id)) continue;
        var updatedRow = values[rowIndex].slice();
        headers.forEach(function(header, columnIndex) {
          if (header !== idColumn && Object.prototype.hasOwnProperty.call(data, header)) {
            updatedRow[columnIndex] = normalizeRecordField_(sheetName, header, data[header]);
          }
        });
        sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([updatedRow]);
        return { success: true, message: 'Registro actualizado correctamente.' };
      }
      throw new Error('No se encontró el registro solicitado.');
    });
  } catch (error) {
    return { success: false, error: 'Error al actualizar: ' + error.toString() };
  }
}

function deleteRecord_(sheetName, idColumn, id) {
  try {
    return withDocumentLock_(function() {
      var sheet = getSpreadsheet().getSheetByName(sheetName);
      if (!sheet) throw new Error('No existe la hoja ' + sheetName);
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var idIndex = headers.indexOf(idColumn);
      if (idIndex === -1) throw new Error('No existe la columna identificadora.');
      var values = sheet.getRange(2, idIndex + 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
      for (var index = 0; index < values.length; index++) {
        if (String(values[index][0]) === String(id)) {
          sheet.deleteRow(index + 2);
          return { success: true, message: 'Registro eliminado correctamente.' };
        }
      }
      throw new Error('No se encontró el registro solicitado.');
    });
  } catch (error) {
    return { success: false, error: 'Error al eliminar: ' + error.toString() };
  }
}

function normalizeRecordField_(sheetName, field, value) {
  var dateFields = ['Fecha', 'Fecha_Inicio', 'Fecha_Programada', 'Fecha_Realizacion'];
  var numericFields = ['Superficie_m2', 'Horas_Invertidas', 'Horas_Estimadas', 'Superficie_Tratada_m2', 'Volumen_100m2_L', 'Capacidad_Estanque_L', 'Dosis_100L', 'Agua_Total_L', 'Numero_Cargas', 'Producto_Total'];
  if (dateFields.indexOf(field) !== -1 && value) return cleanDate_(value, field);
  if (numericFields.indexOf(field) !== -1) return cleanNumber_(value, field, field === 'Superficie_m2' ? 0.1 : 0);
  if (field === 'ID_Huerto') return assertHuertoExists_(value);
  if (field === 'Tipo_Huerto') return requireOption_(value, ['Urbano', 'Familiar', 'Comunitario'], field);
  if (field === 'Estado' && sheetName === 'HUERTOS') return requireOption_(value, ['Activo', 'Inactivo'], field);
  if (field === 'Estado' && sheetName === 'LABORES_PROGRAMADAS') return requireOption_(value, ['Programada', 'Realizada'], field);
  if (field === 'Categoria') return validateConfigCategory_(value);
  if (field === 'Cultivos_Tratados') return cleanSelectionList_(value, field);
  if (field === 'Activo') return value === true;
  if (field === 'Unidad_Producto') return requireOption_(value, ['ml', 'g', 'L', 'kg'], field);
  var requiredFields = ['Nombre_Cliente', 'Ubicacion', 'Tipo_Labor', 'Descripcion_Tecnica', 'Problema_Objetivo', 'Producto_Aplicado', 'Dosis_Utilizada', 'Nombre'];
  return cleanText_(value, field, requiredFields.indexOf(field) !== -1);
}
