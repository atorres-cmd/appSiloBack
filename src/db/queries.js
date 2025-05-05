const { query } = require('./mariadb-config');

// Funciones para componentes
const componentQueries = {
  // Obtener todos los componentes
  getAllComponents: async () => {
    try {
      return await query('SELECT * FROM components');
    } catch (error) {
      console.error('Error al obtener todos los componentes:', error.message);
      throw error;
    }
  },
  
  // Obtener un componente por ID
  getComponentById: async (id) => {
    try {
      const results = await query('SELECT * FROM components WHERE id = ?', [id]);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error al obtener el componente con ID ${id}:`, error.message);
      throw error;
    }
  },
  
  // Obtener componentes por tipo
  getComponentsByType: async (type) => {
    try {
      return await query('SELECT * FROM components WHERE type = ?', [type]);
    } catch (error) {
      console.error(`Error al obtener componentes de tipo ${type}:`, error.message);
      throw error;
    }
  },
  
  // Actualizar un componente
  updateComponent: async (id, data) => {
    try {
      const { name, status, position_x, position_y, position_z, last_activity, cycles_today, efficiency } = data;
      
      const result = await query(
        'UPDATE components SET name = ?, status = ?, position_x = ?, position_y = ?, position_z = ?, last_activity = ?, cycles_today = ?, efficiency = ? WHERE id = ?',
        [name, status, position_x, position_y, position_z, last_activity, cycles_today, efficiency, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error al actualizar el componente con ID ${id}:`, error.message);
      throw error;
    }
  }
};

// Funciones para alarmas
const alarmQueries = {
  // Obtener todas las alarmas
  getAllAlarms: async () => {
    try {
      return await query(`
        SELECT a.*, c.name as component_name 
        FROM alarms a 
        JOIN components c ON a.component_id = c.id 
        ORDER BY a.timestamp DESC
      `);
    } catch (error) {
      console.error('Error al obtener todas las alarmas:', error.message);
      throw error;
    }
  },
  
  // Obtener alarmas por componente
  getAlarmsByComponentId: async (componentId) => {
    try {
      return await query(`
        SELECT a.*, c.name as component_name 
        FROM alarms a 
        JOIN components c ON a.component_id = c.id 
        WHERE a.component_id = ? 
        ORDER BY a.timestamp DESC
      `, [componentId]);
    } catch (error) {
      console.error(`Error al obtener alarmas para el componente ${componentId}:`, error.message);
      throw error;
    }
  },
  
  // Obtener alarmas por tipo
  getAlarmsByType: async (tipo) => {
    try {
      return await query(`
        SELECT a.*, c.name as component_name 
        FROM alarms a 
        JOIN components c ON a.component_id = c.id 
        WHERE a.tipo = ? 
        ORDER BY a.timestamp DESC
      `, [tipo]);
    } catch (error) {
      console.error(`Error al obtener alarmas de tipo ${tipo}:`, error.message);
      throw error;
    }
  },
  
  // Crear una nueva alarma
  createAlarm: async (alarmData) => {
    try {
      const { component_id, titulo, descripcion, tipo } = alarmData;
      
      const result = await query(
        'INSERT INTO alarms (component_id, titulo, descripcion, tipo) VALUES (?, ?, ?, ?)',
        [component_id, titulo, descripcion, tipo]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error al crear una nueva alarma:', error.message);
      throw error;
    }
  },
  
  // Marcar una alarma como resuelta
  resolveAlarm: async (id, resolvedBy) => {
    try {
      const result = await query(
        'UPDATE alarms SET resolved = TRUE, resolved_at = NOW(), resolved_by = ? WHERE id = ?',
        [resolvedBy, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error al marcar como resuelta la alarma con ID ${id}:`, error.message);
      throw error;
    }
  }
};

module.exports = {
  ...componentQueries,
  ...alarmQueries
};
