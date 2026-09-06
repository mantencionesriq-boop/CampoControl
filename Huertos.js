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
        requireActiveConfiguration_(huertoData.Tipo_Huerto, 'TIPO_HUERTO', 'Tipo de huerto'),
        requireActiveConfiguration_(huertoData.Cobertura_Huerto, 'COBERTURA', 'Cobertura del huerto'),
        cleanDate_(huertoData.Fecha_Inicio, 'Fecha de inicio'),
        requireOption_(huertoData.Estado || 'Activo', ['Activo', 'Inactivo'], 'Estado')
      ]);
      return { success: true, message: 'Huerto registrado con éxito con el ID ' + newId };
    });
  } catch (error) {
    return { success: false, error: 'Error al guardar el huerto: ' + error.toString() };
  }
}

function requireActiveConfiguration_(value, category, field) {
  var name = cleanText_(value, field, true);
  var exists = getSheetDataAsObjects(getSpreadsheet().getSheetByName('CONFIGURACION')).some(function(item) {
    return item.Categoria === category && item.Activo && item.Nombre === name;
  });
  if (!exists) throw new Error('Seleccione una opción válida de ' + field + '.');
  return name;
}
