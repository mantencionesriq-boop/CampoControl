function saveAgroquimico(data) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      var sheet = getSpreadsheet().getSheetByName('AGROQUIMICOS');
      var name = cleanText_(data.Nombre_Comercial, 'Nombre comercial', true);
      var normalized = normalizeCatalogName_(name);
      var duplicate = getSheetDataAsObjects(sheet).some(function(item) { return item.Nombre_Normalizado === normalized && item.ID_Agroquimico !== data.ID_Agroquimico; });
      if (duplicate) throw new Error('Ya existe un agroquímico con ese nombre comercial.');
      var now = new Date(), user = currentUserEmail_();
      if (data.ID_Agroquimico) {
        if (!data.ID_Version_Activa) {
          data.ID_Version_Activa = 'VER-' + Utilities.getUuid().slice(0, 8).toUpperCase();
          appendObjectRow_(getSpreadsheet().getSheetByName('AGROQUIMICOS_VERSIONES'), { ID_Version: data.ID_Version_Activa, ID_Agroquimico: data.ID_Agroquimico, Numero_Version: 1, Estado_Revision: 'Confirmada', Confirmado_Por: user, Fecha_Confirmacion: now });
        }
        data.Nombre_Comercial = name; data.Nombre_Normalizado = normalized; data.Fecha_Modificacion = now; data.Modificado_Por = user;
        var result = updateObjectRowNoLock_('AGROQUIMICOS', 'ID_Agroquimico', data.ID_Agroquimico, data);
        if (result.success) audit_('ACTUALIZAR', 'AGROQUIMICO', data.ID_Agroquimico, { nombre: name });
        return result;
      }
      var id = 'AGR-' + Utilities.getUuid().slice(0, 8).toUpperCase();
      var versionId = 'VER-' + Utilities.getUuid().slice(0, 8).toUpperCase();
      appendObjectRow_(sheet, { ID_Agroquimico: id, Nombre_Comercial: name, Nombre_Normalizado: normalized, Ingrediente_Activo: cleanText_(data.Ingrediente_Activo, 'Ingrediente activo', false), Concentracion: cleanText_(data.Concentracion, 'Concentración', false), Formulacion: cleanText_(data.Formulacion, 'Formulación', false), Tipo_Producto: cleanText_(data.Tipo_Producto || 'Otro', 'Tipo de producto', true), Fabricante: cleanText_(data.Fabricante, 'Fabricante', false), Proveedor: cleanText_(data.Proveedor, 'Proveedor', false), Numero_Registro: cleanText_(data.Numero_Registro, 'Número de registro', false), Estado: data.Estado || 'Activo', ID_Version_Activa: versionId, Fecha_Creacion: now, Creado_Por: user });
      appendObjectRow_(getSpreadsheet().getSheetByName('AGROQUIMICOS_VERSIONES'), { ID_Version: versionId, ID_Agroquimico: id, Numero_Version: 1, Estado_Revision: 'Confirmada', Confirmado_Por: user, Fecha_Confirmacion: now });
      audit_('CREAR', 'AGROQUIMICO', id, { nombre: name });
      return { success: true, message: 'Ficha del agroquímico creada.', id: id, versionId: versionId };
    });
  } catch (error) { return { success: false, error: 'Error al guardar el agroquímico: ' + error.toString() }; }
}

function saveAgroquimicoUso(data) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      var product = findRecord_('AGROQUIMICOS', 'ID_Agroquimico', data.ID_Agroquimico);
      if (!product) throw new Error('El agroquímico seleccionado no existe.');
      var min = cleanNumber_(data.Dosis_Minima, 'Dosis mínima', 0), max = cleanNumber_(data.Dosis_Maxima, 'Dosis máxima', 0);
      if (max < min) throw new Error('La dosis máxima no puede ser menor que la mínima.');
      var id = data.ID_Uso || 'USO-' + Utilities.getUuid().slice(0, 8).toUpperCase();
      var record = { ID_Uso: id, ID_Version: data.ID_Version || product.ID_Version_Activa, ID_Agroquimico: product.ID_Agroquimico, Tipo_Aplicacion: cleanText_(data.Tipo_Aplicacion, 'Tipo de aplicación', true), Tipo_Destino: cleanText_(data.Tipo_Destino, 'Tipo de destino', false), Destino: cleanText_(data.Destino, 'Destino', false), Tipo_Objetivo: cleanText_(data.Tipo_Objetivo, 'Tipo de objetivo', false), Objetivo: cleanText_(data.Objetivo, 'Objetivo', true), Dosis_Minima: min, Dosis_Maxima: max, Unidad_Dosis: cleanText_(data.Unidad_Dosis, 'Unidad de dosis', true), Volumen_Agua_Min: Number(data.Volumen_Agua_Min) || '', Volumen_Agua_Max: Number(data.Volumen_Agua_Max) || '', Metodo_Aplicacion: cleanText_(data.Metodo_Aplicacion, 'Método', false), Momento_Aplicacion: cleanText_(data.Momento_Aplicacion, 'Momento', false), Carencia_Dias: Number(data.Carencia_Dias) || 0, Reingreso_Horas: Number(data.Reingreso_Horas) || 0, Restricciones: cleanText_(data.Restricciones, 'Restricciones', false), Activo: data.Activo !== false };
      var result = data.ID_Uso ? updateObjectRowNoLock_('AGROQUIMICOS_USOS', 'ID_Uso', id, record) : (appendObjectRow_(getSpreadsheet().getSheetByName('AGROQUIMICOS_USOS'), record), { success: true, message: 'Uso técnico guardado.' });
      if (result.success) audit_(data.ID_Uso ? 'ACTUALIZAR' : 'CREAR', 'USO_AGROQUIMICO', id, record);
      return result;
    });
  } catch (error) { return { success: false, error: 'Error al guardar el uso: ' + error.toString() }; }
}

function saveMaleza(data) { return saveSimpleCatalog_('MALEZAS', 'ID_Maleza', 'MAL-', data, ['Nombre_Comun', 'Nombre_Cientifico', 'Grupo', 'Ciclo']); }
function saveSectorAplicacion(data) { return saveSimpleCatalog_('SECTORES_APLICACION', 'ID_Sector', 'SEC-', data, ['Nombre', 'Descripcion']); }

function saveSimpleCatalog_(sheetName, idField, prefix, data, fields) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      var id = data[idField] || prefix + Utilities.getUuid().slice(0, 8).toUpperCase(), record = {};
      record[idField] = id;
      fields.forEach(function(field, index) { record[field] = cleanText_(data[field], field, index === 0); });
      record.Activo = data.Activo !== false;
      var result = data[idField] ? updateObjectRowNoLock_(sheetName, idField, id, record) : (appendObjectRow_(getSpreadsheet().getSheetByName(sheetName), record), { success: true, message: 'Catálogo guardado.' });
      if (result.success) audit_(data[idField] ? 'ACTUALIZAR' : 'CREAR', sheetName, id, record);
      return result;
    });
  } catch (error) { return { success: false, error: error.toString() }; }
}

function uploadAgroquimicoDocument(data) {
  try {
    setupDatabase();
    var product = findRecord_('AGROQUIMICOS', 'ID_Agroquimico', data.ID_Agroquimico);
    if (!product) throw new Error('El agroquímico no existe.');
    var mime = requireOption_(data.mimeType, ['application/pdf', 'image/jpeg', 'image/png'], 'Tipo de archivo');
    var bytes = Utilities.base64Decode(String(data.base64 || ''));
    if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error('El archivo debe pesar entre 1 byte y 10 MB.');
    var folder = getAgroquimicoFolder_(product), blob = Utilities.newBlob(bytes, mime, cleanText_(data.fileName, 'Nombre de archivo', true));
    var file = folder.createFile(blob), extraction = extractDocumentText_(blob);
    var id = 'DOC-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    appendObjectRow_(getSpreadsheet().getSheetByName('AGROQUIMICOS_DOCUMENTOS'), { ID_Documento: id, ID_Agroquimico: product.ID_Agroquimico, ID_Version: product.ID_Version_Activa, Tipo_Documento: data.Tipo_Documento || 'Ficha técnica', Nombre_Archivo: file.getName(), Drive_File_ID: file.getId(), Drive_URL: file.getUrl(), Mime_Type: mime, Fecha_Carga: new Date(), Cargado_Por: currentUserEmail_(), Estado_Revision: 'Pendiente', Texto_Extraido: extraction.text });
    audit_('CARGAR_DOCUMENTO', 'AGROQUIMICO', product.ID_Agroquimico, { documento: id, archivo: file.getName() });
    return { success: true, message: extraction.warning || 'Documento cargado y texto extraído.', documentId: id, url: file.getUrl(), extracted: proposeTechnicalFields_(extraction.text), warning: extraction.warning || '' };
  } catch (error) { return { success: false, error: 'Error al cargar el documento: ' + error.toString() }; }
}

function getAgroquimicoFolder_(product) {
  var properties = PropertiesService.getScriptProperties(), rootId = properties.getProperty('CAMPOCONTROL_AGRO_FOLDER_ID'), root;
  if (rootId) { try { root = DriveApp.getFolderById(rootId); } catch (ignored) {} }
  if (!root) { root = DriveApp.createFolder('CampoControl - Agroquímicos'); properties.setProperty('CAMPOCONTROL_AGRO_FOLDER_ID', root.getId()); }
  var name = product.ID_Agroquimico + ' - ' + product.Nombre_Comercial, folders = root.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : root.createFolder(name);
}

function extractDocumentText_(blob) {
  var temp;
  try {
    temp = Drive.Files.insert({ title: 'OCR temporal CampoControl' }, blob, { ocr: true, convert: true, ocrLanguage: 'es' });
    var text = DocumentApp.openById(temp.id).getBody().getText();
    DriveApp.getFileById(temp.id).setTrashed(true);
    return { text: text };
  } catch (error) {
    if (temp && temp.id) try { DriveApp.getFileById(temp.id).setTrashed(true); } catch (ignored) {}
    return { text: '', warning: 'Documento guardado. No fue posible extraer texto automáticamente; complete la ficha manualmente.' };
  }
}

function proposeTechnicalFields_(text) {
  var source = String(text || ''), find = function(pattern) { var match = source.match(pattern); return match ? match[1].trim().slice(0, 250) : ''; };
  return { Nombre_Comercial: find(/(?:nombre comercial|producto)\s*[:\-]\s*([^\n]+)/i), Ingrediente_Activo: find(/ingrediente activo\s*[:\-]\s*([^\n]+)/i), Concentracion: find(/concentraci[oó]n\s*[:\-]\s*([^\n]+)/i), Formulacion: find(/formulaci[oó]n\s*[:\-]\s*([^\n]+)/i), Fabricante: find(/(?:fabricante|titular)\s*[:\-]\s*([^\n]+)/i), Numero_Registro: find(/(?:registro|autorizaci[oó]n)\s*(?:n[°ºo]\.?\s*)?[:\-]?\s*([^\n]+)/i), Periodo_Carencia: find(/(?:per[ií]odo de carencia|carencia)\s*[:\-]\s*([^\n]+)/i), Tiempo_Reingreso: find(/(?:tiempo|per[ií]odo) de reingreso\s*[:\-]\s*([^\n]+)/i), Texto_Referencia: source.slice(0, 5000) };
}

function findRecord_(sheetName, idField, id) {
  return getSheetDataAsObjects(getSpreadsheet().getSheetByName(sheetName)).filter(function(item) { return String(item[idField]) === String(id); })[0] || null;
}

function authorizeCampoControlDrive() {
  var root = DriveApp.getRootFolder();
  return { success: true, message: 'Google Drive autorizado para CampoControl.', rootId: root.getId() };
}
