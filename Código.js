/** Punto de entrada de la aplicación web. */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('MANTENCIONES RIQ SPA - Bitácora de Huertos Urbanos')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Inserta componentes HTML, CSS y JavaScript en las plantillas. */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
