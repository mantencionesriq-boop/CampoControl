function addHuerto(huertoData) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      var sheet = getSpreadsheet().getSheetByName('HUERTOS');
      var newId = 'HUT-' + Utilities.getUuid().slice(0, 8).toUpperCase();
      sheet.appendRow([
        newId,
        cleanText_(huertoData.Nombre_Cliente, 'Cliente / proyecto', true),
        cleanText_(huertoData.Ubicacion, 'Ubicación', true),
        cleanNumber_(huertoData.Superficie_m2, 'Superficie', 0.1),
        requireOption_(huertoData.Tipo_Huerto, ['Urbano', 'Familiar', 'Comunitario'], 'Tipo de huerto'),
        cleanDate_(huertoData.Fecha_Inicio, 'Fecha de inicio'),
        requireOption_(huertoData.Estado || 'Activo', ['Activo', 'Inactivo'], 'Estado')
      ]);
      return { success: true, message: 'Huerto registrado con éxito con el ID ' + newId };
    });
  } catch (error) {
    return { success: false, error: 'Error al guardar el huerto: ' + error.toString() };
  }
}
