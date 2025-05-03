// Script para copiar archivos estáticos de src/public a dist/public
const fs = require('fs');
const path = require('path');

// Crear la carpeta dist/public si no existe
const publicDir = path.join(__dirname, 'dist', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Carpeta dist/public creada');
}

// Copiar archivos de src/public a dist/public
const srcPublicDir = path.join(__dirname, 'src', 'public');
fs.readdirSync(srcPublicDir).forEach(file => {
  const srcPath = path.join(srcPublicDir, file);
  const destPath = path.join(publicDir, file);
  
  fs.copyFileSync(srcPath, destPath);
  console.log(`Archivo ${file} copiado a dist/public`);
});

console.log('Todos los archivos estáticos han sido copiados correctamente');
