# Roadmap ERP de Gestión Operativa

## Propósito

Evolucionar CampoControl desde una aplicación agrícola operativa hacia un ERP
multiempresa para servicios. CampoControl no se reemplaza: pasa a ser el módulo
agrícola del ERP y conserva los huertos, cultivos, labores y aplicaciones ya
registrados.

## Principios de arquitectura

- Una sola fuente de verdad: MySQL será la base transaccional del ERP. Google
  Sheets queda disponible para importación, exportación y respaldo controlado.
- Aislamiento obligatorio: todo registro de negocio pertenece a una empresa.
- Seguridad por diseño: permisos, auditoría y archivos privados se implementan
  antes de exponer procesos sensibles.
- Evolución gradual: los módulos actuales siguen funcionando mientras se agrega
  la nueva estructura.
- Web administrativa y operación móvil: las funciones de terreno se diseñan
  para conectividad intermitente, sin seguimiento de ubicación continuo.

## Fases de implementación

### Fase 0 - Fundaciones del ERP

Objetivo: habilitar una plataforma segura que soporte todos los módulos.

- Empresa, perfil tributario y configuración general.
- Usuarios, membresías, roles Administrador/Supervisor/Operador y permisos.
- Sesión, recuperación de acceso, desactivación de usuarios y mínimo privilegio.
- `empresa_id` en cada entidad de negocio y filtros obligatorios en servidor.
- Auditoría inmutable de cambios, exportaciones, descargas y excepciones.
- Archivos privados con metadatos, autorización y trazabilidad de descarga.
- Migración de los datos actuales a una empresa inicial: Mantenciones RIQ SpA.

Criterio de salida: un usuario no puede consultar ni modificar datos de otra
empresa y cada operación sensible conserva usuario, fecha, resultado y origen.

### Fase 1 - Clientes, ventas y órdenes de trabajo

Objetivo: transformar un servicio vendido en una operación programable.

- Clientes, contactos, sedes, propiedades, predios y activos.
- Servicios, listas de precio, impuestos, descuentos y materiales.
- Cotizaciones versionadas; una cotización aceptada genera una sola orden.
- Órdenes con estados: pendiente de programación, programada, asignada, en
  ejecución, realizada, pendiente de pago, pagada y cancelada.
- Pagos, abonos, saldos, vencimientos y cobranza; sin procesar pagos en línea
  durante esta fase.
- Agenda, recurrencias, disponibilidad y detección de conflictos.

Criterio de salida: una cotización aceptada puede convertirse en una orden,
asignarse a recursos y quedar trazable hasta su pago o cancelación.

### Fase 2 - Operación móvil, inventario y CampoControl agrícola

Objetivo: ejecutar y controlar los trabajos en terreno.

- Agenda propia del operador, inicio/pausa/cierre de tarea, checklist y
  evidencias.
- Ubicación solo en eventos autorizados de jornada y tarea; registrar precisión,
  motivo de excepción y consentimiento.
- Cola offline local, sincronización, reintentos y resolución de conflictos.
- Bodegas, existencias, compras, proveedores, lotes, vencimientos, mermas,
  devoluciones y ajustes auditados.
- Consumo de materiales e insumos al cerrar una orden.
- Migración de CampoControl a predios, lotes, cultivos, labores, aplicaciones,
  incidencias de plagas y reportes agrícolas.
- Aplicaciones fitosanitarias con producto, lote, dosis, superficie, clima,
  equipo, operador, evidencia, reingreso y carencia.

Criterio de salida: un operador puede ejecutar una tarea con evidencia aun sin
señal, y el supervisor puede validar su cierre y el consumo asociado.

### Fase 3 - Documentos, analítica e integraciones

Objetivo: cerrar el ciclo administrativo y habilitar integración progresiva.

- Paneles por empresa: ventas, cobranza, productividad, órdenes, inventario y
  agricultura.
- Exportaciones CSV, Excel y PDF restringidas por rol y auditadas.
- Cotizaciones PDF versionadas y de solo lectura al ser aceptadas.
- DTE/SII opcional por empresa: certificados protegidos, folios, respuestas,
  reintentos y contingencia.
- Correo y notificaciones push; sin SMS o WhatsApp hasta contar con integración
  autorizada.
- Soporte, incidentes, respaldos, restauración autorizada y API futura.

Criterio de salida: la empresa puede medir su operación y emitir documentos
habilitados sin exponer información entre empresas.

## Modelo de datos objetivo

```text
Empresa
 ├─ Usuario ─ Membresía/Rol ─ Permiso
 ├─ Cliente ─ Contacto
 │   └─ Sede / Predio ─ Activo
 │       └─ Lote ─ Cultivo
 ├─ Cotización ─ Versión ─ Ítem
 │   └─ Orden de trabajo ─ Tarea ─ Asignación ─ Evidencia
 │       ├─ Consumo de inventario ─ Movimiento ─ Lote de inventario
 │       └─ Pago / Abono / Cobranza
 ├─ Catálogo de productos ─ Uso técnico ─ Proveedor
 ├─ Aplicación fitosanitaria ─ Cultivo tratado / Incidencia
 └─ Auditoría / Alerta / Solicitud de soporte / Respaldo
```

Entidades transversales obligatorias: `id`, `empresa_id`, `creado_en`,
`creado_por`, `actualizado_en`, `actualizado_por`, `estado` y, cuando aplique,
`version` o `eliminado_en`.

## Equivalencias de migración desde CampoControl

| CampoControl actual | Entidad ERP destino | Regla de migración |
| --- | --- | --- |
| Huerto | Sede/Predio | Crear un predio por huerto, conservando cliente y ubicación. |
| Cultivo/cobertura | Cultivo | Conservar variedad, sector y estado; luego asociar a lote. |
| Labor cultural | Tarea agrícola | Mantener fecha, horas, cultivo, estado y descripción. |
| Aplicación fitosanitaria | Aplicación fitosanitaria | Conservar producto, dosis, superficie, cultivos y estado. |
| Agroquímico/Uso | Producto técnico/Uso técnico | Mantener catálogo, dosis y restricciones. |
| Planificación | Tarea/recurrencia | Convertir registros simples en tareas; reglas repetitivas en recurrencias. |
| Configuración | Catálogo por empresa | Asignar a la empresa migrada y conservar la categoría. |

## Reglas no negociables

- Una empresa no accede a datos de otra.
- El operador solo ve sus tareas y los datos necesarios para ejecutarlas.
- Una cotización aceptada genera una sola orden de trabajo.
- No se descuenta inventario sin movimiento trazable, causa y responsable.
- Lotes vencidos, stock negativo y ajustes requieren excepción autorizada.
- Evidencias, firmas, PDFs, XML y certificados no se publican mediante enlaces
  permanentes.
- La geolocalización no es seguimiento continuo; se limita a eventos laborales
  autorizados.
- Las acciones sensibles y las restauraciones quedan auditadas.

## Decisiones pendientes antes de desarrollar Fase 0

1. Definir proveedor de identidad y método de autenticación.
2. Confirmar si la aplicación local MySQL será el entorno definitivo de
   producción o si requerirá una infraestructura administrada.
3. Establecer la política de conservación, exportación y eliminación de datos.
4. Definir el alcance inicial de DTE/SII y el responsable tributario.
5. Priorizar los rubros iniciales: agrícola, jardinería, mantención general u
   otro.
6. Acordar qué datos de Google Sheets se migrarán y cuál será su fecha de corte.
