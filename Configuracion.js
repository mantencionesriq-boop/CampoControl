function saveConfiguracion(data) {
  try {
    setupDatabase();
    var sheet = getSpreadsheet().getSheetByName('CONFIGURACION');
    data.Categoria = requireOption_(data.Categoria, ['LABOR', 'PRODUCTO'], 'Categoría');
    data.Nombre = cleanText_(data.Nombre, 'Nombre', true);
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
      sheet.appendRow([id, data.Categoria, data.Nombre, data.Activo]);
      return { success: true, message: 'Configuración guardada correctamente.' };
    });
  } catch (error) {
    return { success: false, error: 'Error al guardar la configuración: ' + error.toString() };
  }
}
