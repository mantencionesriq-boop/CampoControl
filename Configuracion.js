function saveConfiguracion(data) {
  try {
    setupDatabase();
    var sheet = getSpreadsheet().getSheetByName('CONFIGURACION');
    if (data.ID_Configuracion) {
      return updateRecord_('CONFIGURACION', 'ID_Configuracion', data.ID_Configuracion, data);
    }
    var existing = getSheetDataAsObjects(sheet).some(function(item) {
      return item.Categoria === data.Categoria && String(item.Nombre).toLowerCase() === String(data.Nombre).trim().toLowerCase();
    });
    if (existing) return { success: true, message: 'La opción ya existe en el catálogo.' };
    var id = 'CFG-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    sheet.appendRow([id, data.Categoria, String(data.Nombre).trim(), data.Activo !== false]);
    return { success: true, message: 'Configuración guardada correctamente.' };
  } catch (error) {
    return { success: false, error: 'Error al guardar la configuración: ' + error.toString() };
  }
}

function saveCultivo(data) {
  try {
    setupDatabase();
    if (!data.ID_Huerto || !String(data.Nombre || '').trim()) throw new Error('Seleccione un huerto e indique el cultivo.');
    if (data.ID_Cultivo) return updateRecord_('CULTIVOS', 'ID_Cultivo', data.ID_Cultivo, data);
    getSpreadsheet().getSheetByName('CULTIVOS').appendRow(['CUL-' + Utilities.getUuid().slice(0, 8).toUpperCase(), data.ID_Huerto, String(data.Nombre).trim(), data.Activo !== false]);
    return { success: true, message: 'Cultivo guardado correctamente.' };
  } catch (error) { return { success: false, error: 'Error al guardar el cultivo: ' + error.toString() }; }
}

function deleteCultivo(id) { return deleteRecord_('CULTIVOS', 'ID_Cultivo', id); }

function saveInsumo(data) {
  try {
    setupDatabase();
    if (!String(data.Nombre_Producto || '').trim()) throw new Error('Indique el nombre del producto.');
    if (data.ID_Insumo) return updateRecord_('MAESTRO_INSUMOS', 'ID_Insumo', data.ID_Insumo, data);
    getSpreadsheet().getSheetByName('MAESTRO_INSUMOS').appendRow([
      'INS-' + Utilities.getUuid().slice(0, 8).toUpperCase(), String(data.Nombre_Producto).trim(), data.Ingrediente_Activo || '', data.Tipo || '', data.Via_Aplicacion || '', data.Dosis_Referencia || '', data.Precio_Referencia || '', data.Activo !== false
    ]);
    return { success: true, message: 'Producto técnico guardado correctamente.' };
  } catch (error) { return { success: false, error: 'Error al guardar el producto: ' + error.toString() }; }
}

function deleteInsumo(id) { return deleteRecord_('MAESTRO_INSUMOS', 'ID_Insumo', id); }

function importInsumos(rows) {
  try {
    setupDatabase();
    if (!Array.isArray(rows)) throw new Error('El archivo CSV no es válido.');
    var sheet = getSpreadsheet().getSheetByName('MAESTRO_INSUMOS');
    var values = rows.filter(function(row) { return String(row.Nombre_Producto || '').trim(); }).map(function(row) {
      return ['INS-' + Utilities.getUuid().slice(0, 8).toUpperCase(), String(row.Nombre_Producto).trim(), row.Ingrediente_Activo || '', row.Tipo || '', row.Via_Aplicacion || '', row.Dosis_Referencia || '', row.Precio_Referencia || '', row.Activo !== false && row.Activo !== 'false'];
    });
    if (values.length) sheet.getRange(sheet.getLastRow() + 1, 1, values.length, values[0].length).setValues(values);
    return { success: true, message: values.length + ' productos importados.' };
  } catch (error) { return { success: false, error: 'Error al importar CSV: ' + error.toString() }; }
}
