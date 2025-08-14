import express from 'express';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para recibir el formulario
app.post('/api/subscribe', async (req, res) => {
  try {
    const { nombre, email, consentimiento } = req.body;
    if (!email) {
      return res.status(400).send('El email es obligatorio');
    }
    await pool.query(
      `INSERT INTO suscriptores (nombre, email, consentimiento)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [nombre, email, consentimiento === 'on']
    );
    res.send('¡Gracias por suscribirte!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
