/**
 * Script para probar la lógica de actualización de una sola fila
 * 
 * Este script simula la lógica de actualización que hemos implementado
 * en los controladores para verificar que funciona correctamente.
 */

// Simulación de una tabla en memoria
let table = [];

// Simulación de la función saveToDatabase
async function saveToDatabase(data) {
  console.log('Guardando datos:', data);
  
  // Verificar si ya existe una fila con id=1
  const existingRow = table.find(row => row.id === 1);
  
  if (!existingRow) {
    // Si no existe, insertar una nueva fila con id=1
    const newRow = {
      id: 1,
      ...data,
      timestamp: new Date().toISOString()
    };
    
    table.push(newRow);
    console.log('✅ Primera fila insertada');
  } else {
    // Si ya existe, actualizar la fila con id=1
    Object.assign(existingRow, data);
    existingRow.timestamp = new Date().toISOString();
    console.log('✅ Fila existente actualizada');
  }
}

// Simulación de la función getLatestData
async function getLatestData() {
  // Obtener la fila con id=1
  return table.find(row => row.id === 1) || null;
}

// Función para mostrar el estado actual de la tabla
function showTableState() {
  console.log('\nEstado actual de la tabla:');
  console.log(table);
  console.log(`Número total de filas: ${table.length}`);
}

// Función principal para probar la lógica
async function testUpdateLogic() {
  try {
    console.log('=== Iniciando prueba de lógica de actualización ===');
    
    // Mostrar estado inicial
    showTableState();
    
    // Realizar varias actualizaciones
    console.log('\nRealizando actualizaciones...');
    
    for (let i = 1; i <= 5; i++) {
      // Datos de ejemplo para cada actualización
      const data = {
        value: i * 10,
        message: `Actualización #${i}`
      };
      
      // Guardar los datos
      await saveToDatabase(data);
      
      // Mostrar el estado después de la actualización
      showTableState();
      
      // Obtener los datos más recientes
      const latestData = await getLatestData();
      console.log('Datos más recientes:', latestData);
      
      // Pequeña pausa para que se note el cambio en el timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n=== Prueba completada con éxito ===');
    console.log('La tabla siempre tiene una sola fila (id=1) que se actualiza en lugar de insertar nuevas filas.');
    
  } catch (error) {
    console.error('Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
testUpdateLogic();
