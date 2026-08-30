function addHuerto(huertoData) {
  try {
    setupDatabase();
    var sheet = getSpreadsheet().getSheetByName('HUERTOS');
    var newId = 'HUT-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    sheet.appendRow([newId, huertoData.Nombre_Cliente, huertoData.Ubicacion, huertoData.Superficie_m2, huertoData.Tipo_Huerto, huertoData.Fecha_Inicio, huertoData.Estado || 'Activo']);
    return { success: true, message: 'Huerto registrado con éxito con el ID ' + newId };
  } catch (error) {
    return { success: false, error: 'Error al guardar el huerto: ' + error.toString() };
  }
}
