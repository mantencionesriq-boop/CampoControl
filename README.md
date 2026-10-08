# CampoControl

Aplicación de gestión de huertos, labores culturales, aplicaciones fitosanitarias,
planificación y catálogos. El repositorio contiene tanto la aplicación publicada en
Google Apps Script como el entorno local de desarrollo con MySQL.

## Estructura

```
apps-script/  Código publicado mediante Google Apps Script y clasp.
local/        Servidor local, migraciones, acceso MySQL, datos y recursos de desarrollo.
.vscode/      Configuración local del editor.
package.json  Comandos y dependencias del entorno local.
.clasp.json   Vínculo con el proyecto de Apps Script; su raíz es apps-script/.
```

Los archivos de `apps-script/` se mantienen en un único nivel a propósito: las
plantillas de Apps Script se cargan por nombre, por ejemplo `include('Header')`.
Moverlas a subcarpetas cambiaría esos nombres y rompería las referencias.

## Desarrollo local

1. Instala dependencias:
   ```powershell
   npm install
   ```
2. Configura `local/.env` a partir de `local/.env.example`.
3. Inicia el servidor:
   ```powershell
   npm run dev
   ```

## Google Apps Script

1. Instala y autentica clasp:
   ```powershell
   npm install -g @google/clasp
   clasp login
   ```
2. Revisa los cambios y sincroniza solo cuando estén validados:
   ```powershell
   clasp status
   clasp push
   ```

`.clasp.json` conecta este repositorio con el proyecto de Apps Script. Solo personas
con permisos en ese proyecto pueden sincronizar o publicar una implementación web.
