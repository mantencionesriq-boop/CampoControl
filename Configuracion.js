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
