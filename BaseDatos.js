var ESQUEMA_BASE_DATOS = {
  HUERTOS: ['ID_Huerto', 'Nombre_Cliente', 'Ubicacion', 'Superficie_m2', 'Tipo_Huerto', 'Fecha_Inicio', 'Estado'],
  BITACORA_CULTURAL: ['ID_Labor', 'ID_Huerto', 'Fecha', 'Tipo_Labor', 'Descripcion_Tecnica', 'Horas_Invertidas'],
  BITACORA_FITOSANITARIA: ['ID_Aplicacion', 'ID_Huerto', 'Fecha', 'Problema_Objetivo', 'Producto_Aplicado', 'Dosis_Utilizada', 'Eficacia_Observada', 'Superficie_Tratada_m2', 'Tipo_Aplicacion'],
  MAESTRO_INSUMOS: ['ID_Insumo', 'Nombre_Producto', 'Ingrediente_Activo', 'Tipo', 'Via_Aplicacion', 'Dosis_Referencia', 'Precio_Referencia', 'Activo'],
  CONFIGURACION: ['ID_Configuracion', 'Categoria', 'Nombre', 'Activo'],
  LABORES_PROGRAMADAS: ['ID_Programacion', 'ID_Huerto', 'ID_Cultivo', 'Fecha_Programada', 'Tipo_Labor', 'Descripcion', 'Horas_Estimadas', 'Estado', 'Fecha_Realizacion'],
  CULTIVOS: ['ID_Cultivo', 'ID_Huerto', 'Nombre', 'Activo']
};

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function setupDatabase() {
  try {
    var spreadsheet = getSpreadsheet();
    Object.keys(ESQUEMA_BASE_DATOS).forEach(function(sheetName) {
      var sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
      var headers = ESQUEMA_BASE_DATOS[sheetName];
      if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      ensureSheetColumns_(sheet, headers);
      sheet.setFrozenRows(1);
    });
    seedDefaultConfiguration_(spreadsheet.getSheetByName('CONFIGURACION'));
    return { success: true, message: 'Base de datos inicializada correctamente.' };
  } catch (error) {
    return { success: false, error: 'Error al inicializar la base de datos: ' + error.toString() };
  }
}

function ensureSheetColumns_(sheet, expectedHeaders) {
  var currentHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  var missingHeaders = expectedHeaders.filter(function(header) { return currentHeaders.indexOf(header) === -1; });
  if (!missingHeaders.length) return;
  sheet.getRange(1, sheet.getLastColumn() + 1, 1, missingHeaders.length)
    .setValues([missingHeaders])
    .setFontWeight('bold');
}

function seedDefaultConfiguration_(sheet) {
  if (!sheet) return;
  var defaults = [
    ['CFG-LAB-PODA', 'LABOR', 'Poda', true],
    ['CFG-LAB-RIEGO', 'LABOR', 'Riego', true],
    ['CFG-LAB-FERT', 'LABOR', 'Fertilización', true],
    ['CFG-LAB-DESM', 'LABOR', 'Desmalezado', true],
    ['CFG-LAB-SIEM', 'LABOR', 'Siembra / Trasplante', true],
    ['CFG-HUE-URB', 'TIPO_HUERTO', 'Urbano', true],
    ['CFG-HUE-FAM', 'TIPO_HUERTO', 'Familiar', true],
    ['CFG-HUE-COM', 'TIPO_HUERTO', 'Comunitario', true],
    ['CFG-APL-PREV', 'TIPO_APLICACION', 'Preventiva', true],
    ['CFG-APL-CURA', 'TIPO_APLICACION', 'Curativa', true],
    ['CFG-PROD-JABON', 'PRODUCTO', 'Jabón Potásico', true],
    ['CFG-PROD-NEEM', 'PRODUCTO', 'Aceite de Neem', true]
  ];
  var existing = getSheetDataAsObjects(sheet).reduce(function(index, item) {
    index[item.Categoria + '|' + String(item.Nombre).toLowerCase()] = true;
    return index;
  }, {});
  var missing = defaults.filter(function(item) {
    return !existing[item[1] + '|' + item[2].toLowerCase()];
  });
  if (missing.length) sheet.getRange(sheet.getLastRow() + 1, 1, missing.length, missing[0].length).setValues(missing);
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
      laboresProgramadas: getSheetDataAsObjects(spreadsheet.getSheetByName('LABORES_PROGRAMADAS')),
      cultivos: getSheetDataAsObjects(spreadsheet.getSheetByName('CULTIVOS'))
    };
  } catch (error) {
    return { success: false, error: 'Error al recuperar datos del servidor: ' + error.toString() };
  }
}
