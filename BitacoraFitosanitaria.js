function addBitacoraFitosanitaria(fitoData) {
  return saveBitacoraFitosanitaria_(fitoData, false);
}

function saveBitacoraFitosanitaria_(fitoData, isUpdate) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      var product = fitoData.ID_Agroquimico ? findRecord_('AGROQUIMICOS', 'ID_Agroquimico', fitoData.ID_Agroquimico) : findAgroquimicoByName_(fitoData.Producto_Aplicado);
      if (!product) throw new Error('Seleccione un agroquímico registrado.');
      var use = fitoData.ID_Uso ? findRecord_('AGROQUIMICOS_USOS', 'ID_Uso', fitoData.ID_Uso) : null;
      if (use && use.ID_Agroquimico !== product.ID_Agroquimico) throw new Error('El uso seleccionado no corresponde al producto.');
      if (use && use.Tipo_Aplicacion && use.Tipo_Aplicacion !== fitoData.Tipo_Aplicacion) throw new Error('El uso seleccionado no corresponde al tipo de aplicación.');
      if (fitoData.Tipo_Aplicacion === 'Control químico de malezas') {
        if (!cleanOptionalSelectionList_(fitoData.Sectores_Aplicacion)) throw new Error('Seleccione al menos un sector intervenido.');
        cleanText_(fitoData.Tipo_Objetivo, 'Tipo de objetivo', true);
        if (!cleanOptionalSelectionList_(fitoData.Malezas_Objetivo)) throw new Error('Seleccione al menos una maleza o grupo objetivo.');
      }
      var calculation = calculateFitosanitario_(fitoData, use);
      var outside = use && (calculation.dosePer100 < Number(use.Dosis_Minima) || calculation.dosePer100 > Number(use.Dosis_Maxima));
      if (outside) {
        cleanText_(fitoData.Justificacion_Excepcion, 'Justificación de excepción', true);
        var activeEmail = Session.getActiveUser().getEmail();
        if (!activeEmail) throw new Error('La dosis está fuera del rango y no fue posible identificar al usuario autorizado.');
      }
      var id = fitoData.ID_Aplicacion || 'FIT-' + Utilities.getUuid().slice(0, 8).toUpperCase(), now = new Date();
      var record = {
        ID_Aplicacion: id, ID_Huerto: assertHuertoExists_(fitoData.ID_Huerto), Fecha: cleanDate_(fitoData.Fecha, 'Fecha'), Problema_Objetivo: cleanText_(fitoData.Problema_Objetivo, 'Problema objetivo', true), Producto_Aplicado: product.Nombre_Comercial, Dosis_Utilizada: cleanText_(fitoData.Dosis_Utilizada, 'Dosis utilizada', true), Eficacia_Observada: requireOption_(fitoData.Eficacia_Observada, ['En Seguimiento', 'Control Alto', 'Control Medio', 'Sin Respuesta'], 'Eficacia observada'), Cultivos_Tratados: cleanSelectionList_(fitoData.Cultivos_Tratados, 'Cultivos o zonas tratadas'),
        Superficie_Tratada_m2: calculation.surface, Volumen_100m2_L: calculation.volumePer100, Capacidad_Estanque_L: calculation.tankCapacity, Dosis_100L: calculation.dosePer100, Unidad_Producto: calculation.unit, Agua_Total_L: calculation.totalWater, Numero_Cargas: calculation.loads, Producto_Total: calculation.totalProduct,
        ID_Agroquimico: product.ID_Agroquimico, ID_Version: product.ID_Version_Activa, ID_Uso: use ? use.ID_Uso : '', Tipo_Aplicacion: cleanText_(fitoData.Tipo_Aplicacion || 'Aplicación fitosanitaria', 'Tipo de aplicación', true), Ingrediente_Activo_Snapshot: product.Ingrediente_Activo || '', Tipo_Producto_Snapshot: product.Tipo_Producto || '', Sectores_Aplicacion: cleanOptionalSelectionList_(fitoData.Sectores_Aplicacion), Tipo_Objetivo: cleanText_(fitoData.Tipo_Objetivo, 'Tipo de objetivo', false), Malezas_Objetivo: cleanOptionalSelectionList_(fitoData.Malezas_Objetivo), Metodo_Aplicacion: cleanText_(fitoData.Metodo_Aplicacion, 'Método de aplicación', false), Aplicador: cleanText_(fitoData.Aplicador, 'Aplicador', false), Condiciones_Meteorologicas: cleanText_(fitoData.Condiciones_Meteorologicas, 'Condiciones meteorológicas', false), Periodo_Carencia_Snapshot: use ? use.Carencia_Dias : '', Tiempo_Reingreso_Snapshot: use ? use.Reingreso_Horas : '', Fuera_Rango: !!outside, Justificacion_Excepcion: outside ? fitoData.Justificacion_Excepcion : '', Autorizado_Por: outside ? Session.getActiveUser().getEmail() : '', Fecha_Creacion: fitoData.Fecha_Creacion || now, Creado_Por: fitoData.Creado_Por || currentUserEmail_(), Estado_Registro: 'ACTIVO'
      };
      var result;
      if (isUpdate) result = updateObjectRowNoLock_('BITACORA_FITOSANITARIA', 'ID_Aplicacion', id, record);
      else { appendObjectRow_(getSpreadsheet().getSheetByName('BITACORA_FITOSANITARIA'), record); result = { success: true, message: 'Registro fitosanitario guardado correctamente.' }; }
      audit_(isUpdate ? 'ACTUALIZAR' : 'CREAR', 'APLICACION_FITOSANITARIA', id, { producto: product.Nombre_Comercial, fueraRango: !!outside });
      return result;
    });
  } catch (error) {
    return { success: false, error: 'Error al guardar el tratamiento fitosanitario: ' + error.toString() };
  }
}

function findAgroquimicoByName_(name) {
  var normalized = normalizeCatalogName_(name);
  return getSheetDataAsObjects(getSpreadsheet().getSheetByName('AGROQUIMICOS')).filter(function(item) { return item.Nombre_Normalizado === normalized; })[0] || null;
}

function cleanOptionalSelectionList_(value) {
  var items = Array.isArray(value) ? value : String(value || '').split(' · ');
  return items.map(function(item) { return cleanText_(item, 'Selección', false); }).filter(String).filter(function(item, index, all) { return all.indexOf(item) === index; }).join(' · ');
}

function updateObjectRowNoLock_(sheetName, idColumn, id, record) {
  var sheet = getSpreadsheet().getSheetByName(sheetName), values = sheet.getDataRange().getValues(), headers = values[0], idIndex = headers.indexOf(idColumn);
  for (var index = 1; index < values.length; index++) {
    if (String(values[index][idIndex]) !== String(id)) continue;
    sheet.getRange(index + 1, 1, 1, headers.length).setValues([headers.map(function(header, column) { return Object.prototype.hasOwnProperty.call(record, header) ? record[header] : values[index][column]; })]);
    return { success: true, message: 'Registro fitosanitario actualizado.' };
  }
  throw new Error('No se encontró la aplicación.');
}

function calculateFitosanitario_(data, use) {
  var surface = cleanNumber_(data.Superficie_Tratada_m2, 'Superficie tratada', 0.1);
  var volumePer100 = cleanNumber_(data.Volumen_100m2_L, 'Volumen por 100 m²', 0.1);
  var tankCapacity = cleanNumber_(data.Capacidad_Estanque_L, 'Capacidad del estanque', 0.1);
  var dosePer100 = cleanNumber_(data.Dosis_100L, 'Dosis por 100 litros', 0);
  var unit = requireOption_(data.Unidad_Producto, ['ml', 'g', 'L', 'kg'], 'Unidad del producto');
  var totalWater = Math.round((surface / 100 * volumePer100) * 100) / 100;
  var loads = Math.ceil(totalWater / tankCapacity * 100) / 100;
  var useUnit = use ? String(use.Unidad_Dosis || '') : unit + '/100 L';
  var totalProduct = totalWater / 100 * dosePer100;
  if (useUnit === 'L/ha' || useUnit === 'kg/ha') totalProduct = surface / 10000 * dosePer100;
  if (useUnit === 'ml/L') totalProduct = totalWater * dosePer100;
  totalProduct = Math.round(totalProduct * 100) / 100;
  data.Dosis_Utilizada = dosePer100 + ' ' + useUnit + ' · Total ' + totalProduct + ' ' + unit;
  return { surface: surface, volumePer100: volumePer100, tankCapacity: tankCapacity, dosePer100: dosePer100, unit: unit, totalWater: totalWater, loads: loads, totalProduct: totalProduct };
}

function cleanSelectionList_(value, field) {
  var items = Array.isArray(value) ? value : String(value || '').split(' · ');
  items = items.map(function(item) { return cleanText_(item, field, false); }).filter(String);
  if (!items.length) throw new Error('Seleccione al menos un cultivo o zona tratada.');
  return items.filter(function(item, index) { return items.indexOf(item) === index; }).join(' · ');
}
