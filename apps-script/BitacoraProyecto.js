function addBitacoraProyecto(data) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      var record = buildBitacoraProyectoRecord_(data, 'BPR-' + Utilities.getUuid().slice(0, 8).toUpperCase());
      record.Creado_Por = currentUserEmail_();
      record.Fecha_Creacion = new Date();
      appendObjectRow_(getSpreadsheet().getSheetByName('BITACORA_PROYECTO'), record);
      audit_('CREAR', 'BITACORA_PROYECTO', record.ID_Entrada, { categoria: record.Categoria, titulo: record.Titulo });
      return { success: true, message: 'Entrada de bitácora guardada correctamente.' };
    });
  } catch (error) {
    return { success: false, error: 'Error al guardar la entrada de bitácora: ' + error.toString() };
  }
}

function updateBitacoraProyecto(data) {
  try {
    setupDatabase();
    return withDocumentLock_(function() {
      var current = findRecord_('BITACORA_PROYECTO', 'ID_Entrada', data.ID_Entrada);
      if (!current) throw new Error('No se encontró la entrada de bitácora.');
      var record = buildBitacoraProyectoRecord_(data, current.ID_Entrada);
      record.Creado_Por = current.Creado_Por;
      record.Fecha_Creacion = current.Fecha_Creacion;
      updateObjectRowNoLock_('BITACORA_PROYECTO', 'ID_Entrada', current.ID_Entrada, record);
      audit_('ACTUALIZAR', 'BITACORA_PROYECTO', current.ID_Entrada, { categoria: record.Categoria, titulo: record.Titulo });
      return { success: true, message: 'Entrada de bitácora actualizada correctamente.' };
    });
  } catch (error) {
    return { success: false, error: 'Error al actualizar la entrada de bitácora: ' + error.toString() };
  }
}

function deleteBitacoraProyecto(id) {
  return deleteRecord_('BITACORA_PROYECTO', 'ID_Entrada', id);
}

function buildBitacoraProyectoRecord_(data, id) {
  var huertoId = cleanText_(data.ID_Huerto, 'Huerto', false);
  if (huertoId) huertoId = assertHuertoExists_(huertoId);
  return {
    ID_Entrada: id,
    Fecha: cleanDate_(data.Fecha, 'Fecha'),
    ID_Huerto: huertoId,
    Categoria: cleanText_(data.Categoria || 'General', 'Categoría', true),
    Titulo: cleanText_(data.Titulo, 'Título', true),
    Detalle: cleanText_(data.Detalle, 'Detalle', true)
  };
}
