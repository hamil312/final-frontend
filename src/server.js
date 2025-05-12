require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { sendToQueue } = require('./queueService');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Mach.312',
  database: process.env.DB_NAME || 'userdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initializeDbPool() {
    console.log("Intentando conectar a la base de datos...");
    console.log("Host:", dbConfig.host);
    try {
        pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();
        console.log('Conectado exitosamente a la base de datos MySQL!');
        connection.release();
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error.code, error.message);
        console.log('Reintentando conexión en 5 segundos...');
        setTimeout(initializeDbPool, 5000);
    }
}

app.use(express.json());

app.use(async (req, res, next) => {
  if (!pool) {
     console.log("Esperando inicialización del pool de DB...");
     return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB no lista)' });
   }
   // Si necesitas la conexión para CADA request (no siempre eficiente)
   // try {
   //   req.db = await pool.getConnection();
   // } catch (error) {
   //   return res.status(500).json({ message: 'Error al obtener conexión a DB', error: error.message });
   // }
   next();
});

app.get('/', (req, res) => {
  res.send('API CRUD de Usuarios con Node.js, Express, MySQL y Docker');
});

app.post('/users', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son campos requeridos' });
  }
  try {
    const [result] = await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
    await sendToQueue({ id: result.insertId, name, email });
    res.status(201).json({ id: result.insertId, name, email, password });
  } catch (error) {
    console.error("Error al crear usuario:", error);
     if (error.code === 'ER_DUP_ENTRY') {
       return res.status(409).json({ message: 'El email ya está registrado.' });
     }
    res.status(500).json({ message: 'Error interno del servidor al crear usuario', error: error.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: 'Error interno del servidor al obtener usuarios', error: error.message });
  }
});

app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener usuario por ID:", error);
    res.status(500).json({ message: 'Error interno del servidor al obtener usuario', error: error.message });
  }
});

app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nombre y email son requeridos para actualizar' });
  }
  try {
    const [result] = await pool.query('UPDATE users SET name = ?, email = ?, password=? WHERE id = ?', [name, email, password, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado para actualizar' });
    }
     if (result.changedRows === 0 && result.affectedRows === 1) {
        return res.status(200).json({ message: 'Usuario no modificado (datos iguales)', id: parseInt(id), name, email});
     }
    res.json({ message: 'Usuario actualizado exitosamente', id: parseInt(id), name, email });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    if (error.code === 'ER_DUP_ENTRY') {
       return res.status(409).json({ message: 'El email ya está en uso por otro usuario.' });
     }
    res.status(500).json({ message: 'Error interno del servidor al actualizar usuario', error: error.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado para borrar' });
    }
    res.json({ message: 'Usuario borrado exitosamente' });
  } catch (error) {
    console.error("Error al borrar usuario:", error);
    res.status(500).json({ message: 'Error interno del servidor al borrar usuario', error: error.message });
  }
});

initializeDbPool().then(() => {
    app.listen(port, () => {
      console.log(`Servidor API corriendo en http://localhost:${port}`);
    });
}).catch(err => {
    console.error("Fallo crítico al inicializar el pool de DB:", err);
    process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('Cerrando pool de conexiones...');
  if (pool) {
      await pool.end();
  }
  console.log('Pool cerrado. Saliendo.');
  process.exit(0);
});