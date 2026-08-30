var ESQUEMA_BASE_DATOS = {
  HUERTOS: ['ID_Huerto', 'Nombre_Cliente', 'Ubicacion', 'Superficie_m2', 'Tipo_Huerto', 'Fecha_Inicio', 'Estado'],
  BITACORA_CULTURAL: ['ID_Labor', 'ID_Huerto', 'Fecha', 'Tipo_Labor', 'Descripcion_Tecnica', 'Horas_Invertidas'],
  BITACORA_FITOSANITARIA: ['ID_Aplicacion', 'ID_Huerto', 'Fecha', 'Problema_Objetivo', 'Producto_Aplicado', 'Dosis_Utilizada', 'Eficacia_Observada', 'Cultivos_Tratados', 'Superficie_Tratada_m2', 'Volumen_100m2_L', 'Capacidad_Estanque_L', 'Dosis_100L', 'Unidad_Producto', 'Agua_Total_L', 'Numero_Cargas', 'Producto_Total'],
  MAESTRO_INSUMOS: ['ID_Insumo', 'Nombre_Producto', 'Ingrediente_Activo', 'Tipo'],
  CONFIGURACION: ['ID_Configuracion', 'Categoria', 'Nombre', 'Activo'],
  LABORES_PROGRAMADAS: ['ID_Programacion', 'ID_Huerto', 'Fecha_Programada', 'Tipo_Labor', 'Descripcion', 'Horas_Estimadas', 'Estado', 'Fecha_Realizacion']
};

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function withDocumentLock_(callback) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function cleanText_(value, field, required) {
  var text = String(value == null ? '' : value).trim();
  if (required && !text) throw new Error('El campo "' + field + '" es obligatorio.');
  if (text.length > 5000) throw new Error('El campo "' + field + '" es demasiado extenso.');
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function cleanNumber_(value, field, minimum) {
  var number = Number(value);
  if (!isFinite(number) || number < minimum) throw new Error('El campo "' + field + '" no es válido.');
  return number;
}

function cleanDate_(value, field) {
  var text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('La fecha de "' + field + '" no es válida.');
  return text;
}

function requireOption_(value, allowed, field) {
  if (allowed.indexOf(value) === -1) throw new Error('El valor de "' + field + '" no está permitido.');
  return value;
}

function assertHuertoExists_(id) {
  var huertoId = cleanText_(id, 'Huerto', true);
  var sheet = getSpreadsheet().getSheetByName('HUERTOS');
  var ids = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues() : [];
  if (!ids.some(function(row) { return row[0] === huertoId; })) throw new Error('El huerto seleccionado no existe.');
  return huertoId;
}

function setupDatabase() {
  try {
    return withDocumentLock_(function() {
      var spreadsheet = getSpreadsheet();
      if (!spreadsheet) throw new Error('El proyecto no está vinculado a una hoja de cálculo.');
      Object.keys(ESQUEMA_BASE_DATOS).forEach(function(sheetName) {
        var sheet = spreadsheet.getSheetByName(sheetName);
        if (sheet) {
          ensureSheetSchema_(sheet, ESQUEMA_BASE_DATOS[sheetName]);
          return;
        }
        sheet = spreadsheet.insertSheet(sheetName);
        var headers = ESQUEMA_BASE_DATOS[sheetName];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
        sheet.setFrozenRows(1);
      });
      seedDefaultConfiguration_(spreadsheet.getSheetByName('CONFIGURACION'));
      return { success: true, message: 'Base de datos inicializada correctamente.' };
    });
  } catch (error) {
    return { success: false, error: 'Error al inicializar la base de datos: ' + error.toString() };
  }
}

function ensureSheetSchema_(sheet, expectedHeaders) {
  if (sheet.getLastColumn() === 0) return;
  var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  expectedHeaders.forEach(function(header) {
    if (currentHeaders.indexOf(header) !== -1) return;
    var newColumn = sheet.getLastColumn() + 1;
    sheet.getRange(1, newColumn).setValue(header).setFontWeight('bold');
    currentHeaders.push(header);
  });
}

function seedDefaultConfiguration_(sheet) {
  if (!sheet) return;
  var defaults = [
    ['CFG-LAB-PODA', 'LABOR', 'Poda', true],
    ['CFG-LAB-RIEGO', 'LABOR', 'Riego', true],
    ['CFG-LAB-FERT', 'LABOR', 'Fertilización', true],
    ['CFG-LAB-DESM', 'LABOR', 'Desmalezado', true],
    ['CFG-LAB-SIEM', 'LABOR', 'Siembra / Trasplante', true],
    ['CFG-PROD-JABON', 'PRODUCTO', 'Jabón Potásico', true],
    ['CFG-PROD-NEEM', 'PRODUCTO', 'Aceite de Neem', true],
    ['CFG-CUL-FLORES', 'CULTIVO', 'Flores', true],
    ['CFG-CUL-ROSAS', 'CULTIVO', 'Rosas', true],
    ['CFG-CUL-HORT', 'CULTIVO', 'Hortalizas', true],
    ['CFG-CUL-FRUT', 'CULTIVO', 'Árboles frutales', true],
    ['CFG-CUL-ARB', 'CULTIVO', 'Arbustos', true],
    ['CFG-CUL-CESPED', 'CULTIVO', 'Césped', true],
    ['CFG-CUL-ORNAM', 'CULTIVO', 'Plantas ornamentales', true],
    ['CFG-CUL-JARDIN', 'CULTIVO', 'Jardín general', true]
  ];
  var existingIds = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues().map(function(row) { return row[0]; })
    : [];
  var missing = defaults.filter(function(row) { return existingIds.indexOf(row[0]) === -1; });
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
      today: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
    };
  } catch (error) {
    return { success: false, error: 'Error al recuperar datos del servidor: ' + error.toString() };
  }
}
