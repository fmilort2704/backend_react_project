const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use('/img_lvup', express.static(path.join(__dirname, 'img_lvup')));
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.post('/enviar_recibo', async (req, res) => {
  const { email, nombre, apellido, direccion, metodoPago, productos, total, nombreProducto, precio, cantidad } = req.body;

  // Construir el mensaje del recibo
  let mensaje = `Hola ${nombre} ${apellido},\n\nGracias por tu compra. Este es tu recibo:\n\n`;
  if (productos && productos.length > 0) {
    mensaje += 'Productos:\n';
    productos.forEach(p => {
      mensaje += `- ${p.nombre} x${p.cantidad} = ${p.subtotal.toFixed(2)}€\n`;
    });
    mensaje += `Total: ${total}€\n`;
  } else {
    mensaje += `Producto: ${nombreProducto}\nPrecio: ${precio} €\nCantidad: ${cantidad}\n`;
  }
  mensaje += `\nDirección: ${direccion}\nMétodo de pago: ${metodoPago}\n\n¡Gracias por confiar en LvUp!`;

  // Configura tu transporte SMTP (ejemplo con Gmail)
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'noreplylvup@gmail.com',
      pass: 'eefkuylildolsowl'      
    }
  });

  try {
    await transporter.sendMail({
      from: 'noreplylvup@gmail.com',
      to: email,
      subject: 'Recibo de tu compra LvUp',
      text: mensaje
    });
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Cambiado para guardar en la carpeta img_lvup en la raíz del backend
    const dir = path.join(__dirname, 'img_lvup');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Endpoint para subir imagen
app.post('/img_lvup/upload', upload.single('imagen'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No se recibió ninguna imagen.' });
  }
  // Construir la URL pública de la imagen subida
  const url = `/img_lvup/${req.file.filename}`;
  res.json({ success: true, filename: req.file.filename, url });
});

// Endpoint para eliminar imagen
app.post('/img_lvup/delete', (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ success: false, error: 'Falta el nombre de la imagen.' });
  const filePath = path.join(__dirname, 'img_lvup', filename);
  fs.unlink(filePath, err => {
    if (err) {
      return res.status(500).json({ success: false, error: 'No se pudo eliminar la imagen.' });
    }
    res.json({ success: true });
  });
});

app.listen(4000, () => {
  console.log('Servidor de correo escuchando en http://localhost:4000');
});