# Control de Campo

Aplicación web de Google Apps Script para registrar huertos, labores culturales,
aplicaciones fitosanitarias, programación y configuración de catálogos.

## Desarrollo

1. Instala [Node.js](https://nodejs.org/) y `clasp`:
   ```powershell
   npm install -g @google/clasp
   ```
2. Autoriza tu cuenta de Google:
   ```powershell
   clasp login
   ```
3. Sube los cambios autorizados al proyecto:
   ```powershell
   clasp push
   ```

El archivo `.clasp.json` vincula este repositorio con el proyecto de Apps Script.
Sólo las personas con permisos en ese proyecto podrán publicar cambios.
