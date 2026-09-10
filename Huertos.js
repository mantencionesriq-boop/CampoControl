function addHuerto(huertoData) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      var sheet = getSpreadsheet().getSheetByName('HUERTOS');
      var newId = 'HUT-' + Utilities.getUuid().slice(0, 8).toUpperCase();
      appendObjectRow_(sheet, {
        ID_Huerto: newId,
        Nombre_Cliente: cleanText_(huertoData.Nombre_Cliente, 'Cliente / proyecto', true),
        Ubicacion: cleanText_(huertoData.Ubicacion, 'Ubicación', true),
        Superficie_m2: cleanNumber_(huertoData.Superficie_m2, 'Superficie', 0.1),
        Tipo_Huerto: requireOption_(huertoData.Tipo_Huerto, ['Urbano', 'Familiar', 'Comunitario'], 'Tipo de huerto'),
        Fecha_Inicio: cleanDate_(huertoData.Fecha_Inicio, 'Fecha de inicio'),
        Estado: requireOption_(huertoData.Estado || 'Activo', ['Activo', 'Inactivo'], 'Estado'),
        Cultivos_Asignados: cleanOptionalSelectionList_(huertoData.Cultivos_Asignados)
      });
      return { success: true, message: 'Huerto registrado con éxito con el ID ' + newId };
    });
  } catch (error) {
    return { success: false, error: 'Error al guardar el huerto: ' + error.toString() };
  }
}
