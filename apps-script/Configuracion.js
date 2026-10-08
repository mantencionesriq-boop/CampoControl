function saveConfiguracion(data) {
  try {
    setupDatabase();
    var sheet = getSpreadsheet().getSheetByName('CONFIGURACION');
    data.Categoria = validateConfigCategory_(data.Categoria);
    data.Nombre = cleanText_(data.Nombre, 'Nombre', true);
    data.Grupo = cleanText_(data.Grupo, 'Grupo', false);
    data.Activo = data.Activo !== false;
    if (data.ID_Configuracion) {
      return updateRecord_('CONFIGURACION', 'ID_Configuracion', data.ID_Configuracion, data);
    }
    return withDocumentLock_(function() {
      var existing = getSheetDataAsObjects(sheet).some(function(item) {
        return item.Categoria === data.Categoria && String(item.Nombre).toLowerCase() === data.Nombre.toLowerCase();
      });
      if (existing) return { success: true, message: 'La opción ya existe en el catálogo.' };
      var id = 'CFG-' + Utilities.getUuid().slice(0, 8).toUpperCase();
      appendObjectRow_(sheet, { ID_Configuracion: id, Categoria: data.Categoria, Nombre: data.Nombre, Grupo: data.Grupo, Activo: data.Activo });
      return { success: true, message: 'Configuración guardada correctamente.' };
    });
  } catch (error) {
    return { success: false, error: 'Error al guardar la configuración: ' + error.toString() };
  }
}

function deleteConfiguracion(id) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      var item = findRecord_('CONFIGURACION', 'ID_Configuracion', id);
      if (!item) throw new Error('No se encontró la opción solicitada.');
      var inUse = false;
      if (item.Categoria === 'CULTIVO' || item.Categoria === 'COBERTURA') inUse = getSheetDataAsObjects(getSpreadsheet().getSheetByName('HUERTO_CULTIVOS')).some(function(row) { return row.Nombre === item.Nombre; });
      else if (item.Categoria === 'LABOR') inUse = getSheetDataAsObjects(getSpreadsheet().getSheetByName('BITACORA_CULTURAL')).some(function(row) { return row.Tipo_Labor === item.Nombre; }) || getSheetDataAsObjects(getSpreadsheet().getSheetByName('LABORES_PROGRAMADAS')).some(function(row) { return row.Tipo_Labor === item.Nombre; });
      else if (item.Categoria === 'PRODUCTO') inUse = getSheetDataAsObjects(getSpreadsheet().getSheetByName('BITACORA_FITOSANITARIA')).some(function(row) { return row.Producto_Aplicado === item.Nombre; });
      else if (item.Categoria === 'TIPO_HUERTO') inUse = getSheetDataAsObjects(getSpreadsheet().getSheetByName('HUERTOS')).some(function(row) { return row.Tipo_Huerto === item.Nombre; });
      else if (item.Categoria === 'CATEGORIA') inUse = getSheetDataAsObjects(getSpreadsheet().getSheetByName('CONFIGURACION')).some(function(row) { return row.Categoria === item.Nombre; });
      if (inUse) throw new Error('La opción está en uso y no se puede eliminar. Puede dejarla inactiva para ocultarla sin afectar el historial.');
      var sheet = getSpreadsheet().getSheetByName('CONFIGURACION'), values = sheet.getDataRange().getValues(), idIndex = values[0].indexOf('ID_Configuracion');
      for (var index = 1; index < values.length; index++) {
        if (String(values[index][idIndex]) !== String(id)) continue;
        sheet.deleteRow(index + 1);
        audit_('ELIMINAR', 'CONFIGURACION', id, { categoria: item.Categoria, nombre: item.Nombre });
        return { success: true, message: 'Opción eliminada correctamente.' };
      }
      throw new Error('No se encontró la opción solicitada.');
    });
  } catch (error) {
    return { success: false, error: 'Error al eliminar la opción: ' + error.toString() };
  }
}

function validateConfigCategory_(category) {
  var value = cleanText_(category, 'Categoría', true);
  var baseCategories = ['LABOR', 'PRODUCTO', 'CULTIVO', 'COBERTURA', 'TIPO_HUERTO', 'TIPO_APLICACION', 'CATEGORIA'];
  if (baseCategories.indexOf(value) !== -1) return value;
  var sheet = getSpreadsheet().getSheetByName('CONFIGURACION');
  var exists = getSheetDataAsObjects(sheet).some(function(item) {
    return item.Categoria === 'CATEGORIA' && item.Activo && item.Nombre === value;
  });
  if (!exists) throw new Error('La categoría seleccionada no existe o está inactiva.');
  return value;
}
