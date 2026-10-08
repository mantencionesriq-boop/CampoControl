function syncEventToCalendar(title, dateStr, hours, description) {
  try {
    var startDate = new Date(dateStr + 'T09:00:00');
    var endDate = new Date(startDate.getTime() + (hours || 1) * 60 * 60 * 1000);
    CalendarApp.getDefaultCalendar().createEvent(title, startDate, endDate, { description: description, location: 'MANTENCIONES RIQ SPA - Huerto Urbano' });
  } catch (error) {
    console.error('No se pudo sincronizar con Calendar: ' + error.toString());
  }
}
