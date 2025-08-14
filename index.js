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

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para recibir el formulario
app.post('/api/subscribe', async (req, res) => {
  try {
    const { nombre, email, consentimiento } = req.body;

    if (!email) {
      return res.status(400).send('El email es obligatorio');
    }

    // Valores adicionales para la tabla
    const consentimientoTexto = "Acepto recibir encuestas de opinión, análisis y actualizaciones de QSocialNow";
    const consentVersion = "1.0";
    const policyVersion = "1.0";
    const sourceHost = req.hostname || '';
    const sourcePath = req.originalUrl || '';
    const referrer = req.get('Referer') || '';
    const userAgent = req.get('User-Agent') || '';
    const utm = req.query.utm || '';
    const ipRegistro =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      '';

    // Inserción en la base
    await pool.query(
      `INSERT INTO suscriptores (
        nombre, email, consentimiento, consentimiento_texto,
        consent_version, policy_version, source_host, source_path,
        referrer, user_agent, utm, ip_registro
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (email) DO NOTHING`,
      [
        nombre || '',
        email,
        consentimiento === 'on',
        consentimientoTexto,
        consentVersion,
        policyVersion,
        sourceHost,
        sourcePath,
        referrer,
        userAgent,
        utm,
        ipRegistro
      ]
    );

    res.send('¡Gracias por suscribirte!');
  } catch (err) {
    console.error('Error al guardar el suscriptor:', err);
    res.status(500).send('Error en el servidor');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor escuchando en puerto ${PORT}`)
);
