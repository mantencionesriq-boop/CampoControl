var ESQUEMA_BASE_DATOS = {
  HUERTOS: ['ID_Huerto', 'Nombre_Cliente', 'Ubicacion', 'Superficie_m2', 'Tipo_Huerto', 'Fecha_Inicio', 'Estado'],
  HUERTO_CULTIVOS: ['ID_Cultivo', 'ID_Huerto', 'Nombre', 'Variedad', 'Sector', 'Estado'],
  BITACORA_PROYECTO: ['ID_Entrada', 'Fecha', 'ID_Huerto', 'Categoria', 'Titulo', 'Detalle', 'Creado_Por', 'Fecha_Creacion'],
  BITACORA_CULTURAL: ['ID_Labor', 'ID_Huerto', 'ID_Cultivo', 'Cultivo', 'Fecha', 'Tipo_Labor', 'Descripcion_Tecnica', 'Horas_Invertidas'],
  BITACORA_FITOSANITARIA: ['ID_Aplicacion', 'ID_Huerto', 'Fecha', 'Problema_Objetivo', 'Producto_Aplicado', 'Dosis_Utilizada', 'Eficacia_Observada', 'Cultivos_Tratados', 'Superficie_Tratada_m2', 'Volumen_100m2_L', 'Capacidad_Estanque_L', 'Dosis_100L', 'Unidad_Producto', 'Agua_Total_L', 'Numero_Cargas', 'Producto_Total', 'ID_Agroquimico', 'ID_Version', 'ID_Uso', 'Tipo_Aplicacion', 'Ingrediente_Activo_Snapshot', 'Tipo_Producto_Snapshot', 'Sectores_Aplicacion', 'Tipo_Objetivo', 'Malezas_Objetivo', 'Metodo_Aplicacion', 'Aplicador', 'Condiciones_Meteorologicas', 'Periodo_Carencia_Snapshot', 'Tiempo_Reingreso_Snapshot', 'Fuera_Rango', 'Justificacion_Excepcion', 'Autorizado_Por', 'Fecha_Creacion', 'Creado_Por', 'Estado_Registro'],
  MAESTRO_INSUMOS: ['ID_Insumo', 'Nombre_Producto', 'Ingrediente_Activo', 'Tipo'],
  CONFIGURACION: ['ID_Configuracion', 'Categoria', 'Nombre', 'Grupo', 'Activo'],
  LABORES_PROGRAMADAS: ['ID_Programacion', 'ID_Huerto', 'Fecha_Programada', 'Tipo_Labor', 'Descripcion', 'Horas_Estimadas', 'Estado', 'Fecha_Realizacion'],
  AGROQUIMICOS: ['ID_Agroquimico', 'Nombre_Comercial', 'Nombre_Normalizado', 'Ingrediente_Activo', 'Concentracion', 'Formulacion', 'Tipo_Producto', 'Fabricante', 'Proveedor', 'Numero_Registro', 'Estado', 'ID_Version_Activa', 'Fecha_Creacion', 'Creado_Por', 'Fecha_Modificacion', 'Modificado_Por'],
  AGROQUIMICOS_VERSIONES: ['ID_Version', 'ID_Agroquimico', 'Numero_Version', 'Fecha_Documento', 'Periodo_Carencia', 'Tiempo_Reingreso', 'Maximo_Aplicaciones', 'Intervalo_Aplicaciones', 'Compatibilidades', 'Incompatibilidades', 'Precauciones', 'EPP', 'Almacenamiento', 'Estado_Revision', 'Confirmado_Por', 'Fecha_Confirmacion'],
  AGROQUIMICOS_USOS: ['ID_Uso', 'ID_Version', 'ID_Agroquimico', 'Tipo_Aplicacion', 'Tipo_Destino', 'Destino', 'Tipo_Objetivo', 'Objetivo', 'Dosis_Minima', 'Dosis_Maxima', 'Unidad_Dosis', 'Volumen_Agua_Min', 'Volumen_Agua_Max', 'Metodo_Aplicacion', 'Momento_Aplicacion', 'Carencia_Dias', 'Reingreso_Horas', 'Restricciones', 'Activo'],
  AGROQUIMICOS_DOCUMENTOS: ['ID_Documento', 'ID_Agroquimico', 'ID_Version', 'Tipo_Documento', 'Nombre_Archivo', 'Drive_File_ID', 'Drive_URL', 'Mime_Type', 'Fecha_Carga', 'Cargado_Por', 'Estado_Revision', 'Texto_Extraido'],
  MALEZAS: ['ID_Maleza', 'Nombre_Comun', 'Nombre_Cientifico', 'Grupo', 'Ciclo', 'Activo'],
  SECTORES_APLICACION: ['ID_Sector', 'Nombre', 'Descripcion', 'Activo'],
  AUDITORIA: ['ID_Auditoria', 'Fecha_Hora', 'Usuario', 'Accion', 'Entidad', 'ID_Entidad', 'Detalle']
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

function assertSuperficieTratada_(huertoId, superficie) {
  var huerto = getSheetDataAsObjects(getSpreadsheet().getSheetByName('HUERTOS')).filter(function(item) { return String(item.ID_Huerto) === String(huertoId); })[0];
  var treated = cleanNumber_(superficie, 'Superficie tratada', 0.1);
  var maximum = Number(huerto && huerto.Superficie_m2);
  if (!huerto || !isFinite(maximum) || maximum <= 0) throw new Error('El huerto no tiene una superficie válida configurada.');
  if (treated > maximum) throw new Error('La superficie tratada no puede superar los ' + maximum + ' m² del huerto.');
  return treated;
}

function assertConfiguredOption_(category, value, field) {
  var name = cleanText_(value, field, true);
  var exists = getSheetDataAsObjects(getSpreadsheet().getSheetByName('CONFIGURACION')).some(function(item) {
    return item.Categoria === category && item.Nombre === name && (item.Activo === true || item.Activo === 'TRUE');
  });
  if (!exists) throw new Error('El valor de "' + field + '" no está disponible en la configuración.');
  return name;
}

function getHuertoCultivos_(huertoId, activeOnly) {
  var items = getSheetDataAsObjects(getSpreadsheet().getSheetByName('HUERTO_CULTIVOS'))
    .filter(function(item) { return String(item.ID_Huerto) === String(huertoId); });
  return activeOnly ? items.filter(function(item) { return item.Estado === 'Activo'; }) : items;
}

function assertCultivoCoberturaOption_(value) {
  var name = cleanText_(value, 'Cultivo o cobertura', true);
  var exists = getSheetDataAsObjects(getSpreadsheet().getSheetByName('CONFIGURACION')).some(function(item) {
    return (item.Categoria === 'CULTIVO' || item.Categoria === 'COBERTURA') && item.Nombre === name && (item.Activo === true || item.Activo === 'TRUE');
  });
  if (!exists) throw new Error('Seleccione un cultivo o cobertura disponible en Configuración.');
  return name;
}

function assertCultivoDeHuerto_(huertoId, cultivoId) {
  var id = cleanText_(cultivoId, 'Cultivo', true);
  var cultivo = getHuertoCultivos_(huertoId, true).filter(function(item) { return String(item.ID_Cultivo) === id; })[0];
  if (!cultivo) throw new Error('El cultivo seleccionado no está activo o no pertenece al huerto.');
  return cultivo;
}

function cleanCultivosDeHuerto_(huertoId, value) {
  var names = cleanSelectionList_(value, 'Cultivos tratados').split(' · ');
  var allowed = getHuertoCultivos_(huertoId, true).map(function(item) { return item.Nombre; });
  if (!allowed.length) throw new Error('El huerto no tiene cultivos activos. Agréguelos antes de registrar una aplicación.');
  names.forEach(function(name) {
    if (allowed.indexOf(name) === -1) throw new Error('El cultivo "' + name + '" no pertenece al huerto seleccionado.');
  });
  return names.join(' · ');
}

function syncHuertoCultivos_(huertoId, cultivos) {
  if (!Array.isArray(cultivos)) return;
  var sheet = getSpreadsheet().getSheetByName('HUERTO_CULTIVOS');
  var existing = getHuertoCultivos_(huertoId, false);
  var receivedIds = [];
  cultivos.forEach(function(item) {
    var name = assertCultivoCoberturaOption_(item.Nombre);
    var id = String(item.ID_Cultivo || 'CUL-' + Utilities.getUuid().slice(0, 8).toUpperCase());
    var record = { ID_Cultivo: id, ID_Huerto: huertoId, Nombre: name, Variedad: cleanText_(item.Variedad, 'Variedad', false), Sector: cleanText_(item.Sector, 'Sector', false), Estado: requireOption_(item.Estado || 'Activo', ['Activo', 'Inactivo'], 'Estado del cultivo') };
    receivedIds.push(id);
    if (existing.some(function(current) { return String(current.ID_Cultivo) === id; })) updateObjectRowNoLock_('HUERTO_CULTIVOS', 'ID_Cultivo', id, record);
    else appendObjectRow_(sheet, record);
  });
  existing.filter(function(item) { return receivedIds.indexOf(String(item.ID_Cultivo)) === -1; }).forEach(function(item) {
    updateObjectRowNoLock_('HUERTO_CULTIVOS', 'ID_Cultivo', item.ID_Cultivo, { Estado: 'Inactivo' });
  });
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
      migrateConfigurationGroups_(spreadsheet.getSheetByName('CONFIGURACION'));
      migrateLegacyHuertoCultivos_(spreadsheet);
      seedFitosanitarioCatalogs_(spreadsheet);
      migrateLegacyProducts_(spreadsheet);
      return { success: true, message: 'Base de datos inicializada correctamente.' };
    });
  } catch (error) {
    return { success: false, error: 'Error al inicializar la base de datos: ' + error.toString() };
  }
}

function appendObjectRow_(sheet, record) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  sheet.appendRow(headers.map(function(header) { return Object.prototype.hasOwnProperty.call(record, header) ? record[header] : ''; }));
}

function normalizeCatalogName_(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

function currentUserEmail_() {
  return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || 'usuario-no-identificado';
}

function audit_(action, entity, entityId, detail) {
  var sheet = getSpreadsheet().getSheetByName('AUDITORIA');
  if (!sheet) return;
  appendObjectRow_(sheet, { ID_Auditoria: 'AUD-' + Utilities.getUuid().slice(0, 8).toUpperCase(), Fecha_Hora: new Date(), Usuario: currentUserEmail_(), Accion: action, Entidad: entity, ID_Entidad: entityId, Detalle: JSON.stringify(detail || {}) });
}

function seedFitosanitarioCatalogs_(spreadsheet) {
  var weedSheet = spreadsheet.getSheetByName('MALEZAS');
  var sectorSheet = spreadsheet.getSheetByName('SECTORES_APLICACION');
  if (weedSheet.getLastRow() === 1) [['MAL-GENERAL','Malezas en general','','General','',true],['MAL-ANCHA','Malezas de hoja ancha','','Grupo','',true],['MAL-ANGOSTA','Malezas de hoja angosta','','Grupo','',true]].forEach(function(row) { weedSheet.appendRow(row); });
  if (sectorSheet.getLastRow() === 1) [['SEC-CAMINOS','Caminos','Caminos y accesos',true],['SEC-BORDES','Bordes','Bordes y deslindes',true],['SEC-CERCOS','Cercos','Líneas de cercos',true],['SEC-ENTRE','Entrehileras','Espacio entre hileras',true],['SEC-HUERTO','Huerto','Interior del huerto',true],['SEC-JARDIN','Jardín','Áreas de jardín',true],['SEC-CESPED','Césped','Superficies de césped',true],['SEC-SINCULTIVO','Zona sin cultivo','Áreas no cultivadas',true]].forEach(function(row) { sectorSheet.appendRow(row); });
}

function migrateLegacyProducts_(spreadsheet) {
  var target = spreadsheet.getSheetByName('AGROQUIMICOS');
  var existing = getSheetDataAsObjects(target).map(function(item) { return item.Nombre_Normalizado; });
  var names = [];
  getSheetDataAsObjects(spreadsheet.getSheetByName('CONFIGURACION')).filter(function(item) { return item.Categoria === 'PRODUCTO'; }).forEach(function(item) { names.push(item.Nombre); });
  getSheetDataAsObjects(spreadsheet.getSheetByName('BITACORA_FITOSANITARIA')).forEach(function(item) { if (item.Producto_Aplicado) names.push(item.Producto_Aplicado); });
  names.forEach(function(name) {
    var normalized = normalizeCatalogName_(name);
    if (!normalized || existing.indexOf(normalized) !== -1) return;
    var id = 'AGR-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    appendObjectRow_(target, { ID_Agroquimico: id, Nombre_Comercial: name, Nombre_Normalizado: normalized, Tipo_Producto: 'Otro', Estado: 'Pendiente de completar', Fecha_Creacion: new Date(), Creado_Por: currentUserEmail_() });
    existing.push(normalized);
  });
  var productMap = {};
  getSheetDataAsObjects(target).forEach(function(item) { productMap[item.Nombre_Normalizado] = item.ID_Agroquimico; });
  var logSheet = spreadsheet.getSheetByName('BITACORA_FITOSANITARIA');
  if (logSheet.getLastRow() > 1) {
    var values = logSheet.getDataRange().getValues(), headers = values[0], productNameIndex = headers.indexOf('Producto_Aplicado'), productIdIndex = headers.indexOf('ID_Agroquimico'), stateIndex = headers.indexOf('Estado_Registro');
    var changed = false;
    for (var row = 1; row < values.length; row++) {
      if (!values[row][productIdIndex]) { values[row][productIdIndex] = productMap[normalizeCatalogName_(values[row][productNameIndex])] || ''; changed = true; }
      if (!values[row][stateIndex]) { values[row][stateIndex] = 'MIGRADO'; changed = true; }
    }
    if (changed) logSheet.getRange(2, 1, values.length - 1, headers.length).setValues(values.slice(1));
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
    ['CFG-HUE-URB', 'TIPO_HUERTO', 'Urbano', true],
    ['CFG-HUE-FAM', 'TIPO_HUERTO', 'Familiar', true],
    ['CFG-HUE-COM', 'TIPO_HUERTO', 'Comunitario', true],
    ['CFG-HUE-JAR', 'TIPO_HUERTO', 'Jardín', true],
    ['CFG-APL-FITO', 'TIPO_APLICACION', 'Aplicación fitosanitaria', true],
    ['CFG-APL-MAL', 'TIPO_APLICACION', 'Control químico de malezas', true],
    ['CFG-APL-PLA', 'TIPO_APLICACION', 'Control de plagas', true],
    ['CFG-APL-ENF', 'TIPO_APLICACION', 'Control de enfermedades', true],
    ['CFG-PROD-JABON', 'PRODUCTO', 'Jabón Potásico', true],
    ['CFG-PROD-NEEM', 'PRODUCTO', 'Aceite de Neem', true],
    ['CFG-CUL-FLORES', 'CULTIVO', 'Flores', true],
    ['CFG-CUL-ROSAS', 'CULTIVO', 'Rosas', true],
    ['CFG-CUL-HORT', 'CULTIVO', 'Hortalizas', true],
    ['CFG-CUL-FRUT', 'CULTIVO', 'Árboles frutales', true],
    ['CFG-CUL-ARB', 'CULTIVO', 'Arbustos', true],
    ['CFG-CUL-CESPED', 'CULTIVO', 'Césped', true],
    ['CFG-CUL-ORNAM', 'CULTIVO', 'Plantas ornamentales', true],
    ['CFG-CUL-JARDIN', 'CULTIVO', 'Jardín general', true],
    ['CFG-COB-MULCH', 'COBERTURA', 'Mulch orgánico', true],
    ['CFG-COB-VEGETAL', 'COBERTURA', 'Cobertura vegetal', true],
    ['CFG-COB-PIEDRA', 'COBERTURA', 'Grava o piedra', true],
    ['CFG-COB-GEOTEXTIL', 'COBERTURA', 'Geotextil', true],
    ['CFG-COB-SUELO', 'COBERTURA', 'Suelo desnudo', true]
  ];
  var existingIds = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues().map(function(row) { return row[0]; })
    : [];
  var missing = defaults.filter(function(row) { return existingIds.indexOf(row[0]) === -1; });
  missing.forEach(function(row) { appendObjectRow_(sheet, { ID_Configuracion: row[0], Categoria: row[1], Nombre: row[2], Grupo: '', Activo: row[3] }); });
}

function migrateConfigurationGroups_(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return;
  var rows = sheet.getDataRange().getValues(), headers = rows[0], categoryIndex = headers.indexOf('Categoria'), nameIndex = headers.indexOf('Nombre'), groupIndex = headers.indexOf('Grupo');
  if (groupIndex === -1) return;
  var frutales = ['Limonero','Naranjo','Mandarino','Palto','Olivo','Manzano','Peral','Duraznero','Almendro','Higuera','Granado','Vid','Otro frutal','Pomelo','Lima','Kumquat','Membrillo','Nectarino','Cerezo','Nogal','Avellano europeo','Caqui','Níspero','Mango','Guayabo','Chirimoyo','Papayo','Kiwi','Frambuesa','Mora','Arándano','Frutilla'];
  var hortalizas = ['Tomate','Tomate cherry','Pimiento','Ají','Berenjena','Zapallo italiano','Zapallo','Pepino','Melón','Sandía','Lechuga','Espinaca','Acelga','Rúcula','Repollo','Coliflor','Brócoli','Kale','Apio','Puerro','Cebolla','Ajo','Zanahoria','Rabanito','Remolacha','Nabo','Papa','Camote','Arveja','Poroto','Haba','Maíz','Albahaca','Cilantro','Perejil','Orégano','Romero','Tomillo','Menta'];
  var ornamentales = ['Rosa','Rosas','Jazmín','Lavanda','Hortensia','Camelia','Azalea','Buganvilia','Geranio','Petunia','Margarita','Lirio','Tulipán','Narciso','Dalia','Orquídea','Clavel','Hibisco','Adelfa','Pitosporo','Ligustro','Ficus','Palmera','Araucaria','Ciprés','Jacarandá','Magnolio','Liquidámbar','Plátano oriental','Cubresuelo','Arbustos'];
  var changed = false;
  for (var row = 1; row < rows.length; row++) {
    if (rows[row][groupIndex] || (rows[row][categoryIndex] !== 'CULTIVO' && rows[row][categoryIndex] !== 'COBERTURA')) continue;
    var name = String(rows[row][nameIndex] || ''), group = rows[row][categoryIndex] === 'COBERTURA' ? 'Coberturas' : frutales.indexOf(name) !== -1 ? 'Frutales' : hortalizas.indexOf(name) !== -1 ? 'Hortalizas' : ornamentales.indexOf(name) !== -1 ? 'Ornamentales' : 'Generales';
    rows[row][groupIndex] = group; changed = true;
  }
  if (changed) sheet.getRange(2, 1, rows.length - 1, headers.length).setValues(rows.slice(1));
}

function migrateLegacyHuertoCultivos_(spreadsheet) {
  var config = spreadsheet.getSheetByName('CONFIGURACION');
  var existing = getSheetDataAsObjects(config).reduce(function(index, item) { index['CULTIVO|' + normalizeCatalogName_(item.Nombre)] = true; return index; }, {});
  getSheetDataAsObjects(spreadsheet.getSheetByName('HUERTO_CULTIVOS')).forEach(function(item) {
    var name = String(item.Nombre || '').trim(), key = 'CULTIVO|' + normalizeCatalogName_(name);
    if (!name || existing[key]) return;
    config.appendRow(['CFG-' + Utilities.getUuid().slice(0, 8).toUpperCase(), 'CULTIVO', name, true]);
    existing[key] = true;
  });
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
      huertoCultivos: getSheetDataAsObjects(spreadsheet.getSheetByName('HUERTO_CULTIVOS')),
      bitacoraProyecto: getSheetDataAsObjects(spreadsheet.getSheetByName('BITACORA_PROYECTO')),
      culturalLogs: getSheetDataAsObjects(spreadsheet.getSheetByName('BITACORA_CULTURAL')),
      fitosanitarioLogs: getSheetDataAsObjects(spreadsheet.getSheetByName('BITACORA_FITOSANITARIA')),
      insumos: getSheetDataAsObjects(spreadsheet.getSheetByName('MAESTRO_INSUMOS')),
      configuraciones: getSheetDataAsObjects(spreadsheet.getSheetByName('CONFIGURACION')),
      laboresProgramadas: getSheetDataAsObjects(spreadsheet.getSheetByName('LABORES_PROGRAMADAS')),
      agroquimicos: getSheetDataAsObjects(spreadsheet.getSheetByName('AGROQUIMICOS')),
      agroquimicosVersiones: getSheetDataAsObjects(spreadsheet.getSheetByName('AGROQUIMICOS_VERSIONES')),
      agroquimicosUsos: getSheetDataAsObjects(spreadsheet.getSheetByName('AGROQUIMICOS_USOS')),
      agroquimicosDocumentos: getSheetDataAsObjects(spreadsheet.getSheetByName('AGROQUIMICOS_DOCUMENTOS')).map(function(item) { delete item.Texto_Extraido; return item; }),
      malezas: getSheetDataAsObjects(spreadsheet.getSheetByName('MALEZAS')),
      sectoresAplicacion: getSheetDataAsObjects(spreadsheet.getSheetByName('SECTORES_APLICACION')),
      today: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
    };
  } catch (error) {
    return { success: false, error: 'Error al recuperar datos del servidor: ' + error.toString() };
  }
}
