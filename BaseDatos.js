var ESQUEMA_BASE_DATOS = {
  HUERTOS: ['ID_Huerto', 'Nombre_Cliente', 'Ubicacion', 'Superficie_m2', 'Tipo_Huerto', 'Fecha_Inicio', 'Estado'],
  BITACORA_CULTURAL: ['ID_Labor', 'ID_Huerto', 'Fecha', 'Tipo_Labor', 'Descripcion_Tecnica', 'Horas_Invertidas'],
  BITACORA_FITOSANITARIA: ['ID_Aplicacion', 'ID_Huerto', 'Fecha', 'Problema_Objetivo', 'Producto_Aplicado', 'Dosis_Utilizada', 'Eficacia_Observada'],
  MAESTRO_INSUMOS: ['ID_Insumo', 'Nombre_Producto', 'Ingrediente_Activo', 'Tipo'],
  CONFIGURACION: ['ID_Configuracion', 'Categoria', 'Nombre', 'Activo'],
  LABORES_PROGRAMADAS: ['ID_Programacion', 'ID_Huerto', 'Fecha_Programada', 'Tipo_Labor', 'Descripcion', 'Horas_Estimadas', 'Estado', 'Fecha_Realizacion']
};

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function setupDatabase() {
  try {
    var spreadsheet = getSpreadsheet();
    Object.keys(ESQUEMA_BASE_DATOS).forEach(function(sheetName) {
      if (spreadsheet.getSheetByName(sheetName)) return;
      var sheet = spreadsheet.insertSheet(sheetName);
      var headers = ESQUEMA_BASE_DATOS[sheetName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sheet.setFrozenRows(1);
    });
    seedDefaultConfiguration_(spreadsheet.getSheetByName('CONFIGURACION'));
    return { success: true, message: 'Base de datos inicializada correctamente.' };
  } catch (error) {
    return { success: false, error: 'Error al inicializar la base de datos: ' + error.toString() };
  }
}

function seedDefaultConfiguration_(sheet) {
  if (!sheet || sheet.getLastRow() > 1) return;
  var defaults = [
    ['CFG-LAB-PODA', 'LABOR', 'Poda', true],
    ['CFG-LAB-RIEGO', 'LABOR', 'Riego', true],
    ['CFG-LAB-FERT', 'LABOR', 'Fertilización', true],
    ['CFG-LAB-DESM', 'LABOR', 'Desmalezado', true],
    ['CFG-LAB-SIEM', 'LABOR', 'Siembra / Trasplante', true],
    ['CFG-PROD-JABON', 'PRODUCTO', 'Jabón Potásico', true],
    ['CFG-PROD-NEEM', 'PRODUCTO', 'Aceite de Neem', true]
  ];
  sheet.getRange(2, 1, defaults.length, defaults[0].length).setValues(defaults);
}

function getSheetDataAsObjects(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  return data.slice(1).map(function(row) {
    return headers.reduce(function(record, header, index) {
      var value = row[index];
      record[header] = value instanceof Date
        ? Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd')
        : value;
      return record;
    }, {});
  });
}

function getInitialData() {
  try {
    setupDatabase();
    var spreadsheet = getSpreadsheet();
    return {
      success: true,
      huertos: getSheetDataAsObjects(spreadsheet.getSheetByName('HUERTOS')),
      culturalLogs: getSheetDataAsObjects(spreadsheet.getSheetByName('BITACORA_CULTURAL')),
      fitosanitarioLogs: getSheetDataAsObjects(spreadsheet.getSheetByName('BITACORA_FITOSANITARIA')),
      insumos: getSheetDataAsObjects(spreadsheet.getSheetByName('MAESTRO_INSUMOS')),
      configuraciones: getSheetDataAsObjects(spreadsheet.getSheetByName('CONFIGURACION')),
      laboresProgramadas: getSheetDataAsObjects(spreadsheet.getSheetByName('LABORES_PROGRAMADAS'))
    };
  } catch (error) {
    return { success: false, error: 'Error al recuperar datos del servidor: ' + error.toString() };
  }
}
