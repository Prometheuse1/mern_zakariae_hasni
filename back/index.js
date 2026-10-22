require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const mongoUri = process.env.MONGODB_URI;

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error('PORT must be an integer between 0 and 65535.');
}

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const Item = mongoose.model('Item', itemSchema);
const demoItems = [
  { name: 'Élément de démonstration', description: 'Un premier élément exemple.' },
];

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/items', async (_req, res, next) => {
  if (!mongoUri) {
    return res.json(demoItems);
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'La base de données est indisponible.' });
  }

  try {
    const items = await Item.find().lean();
    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/items', async (req, res, next) => {
  const { name, description } = req.body ?? {};

  if (
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    (description !== undefined && typeof description !== 'string')
  ) {
    return res.status(400).json({
      error: 'Le champ "name" est obligatoire et "description" doit être une chaîne de caractères.',
    });
  }

  if (!mongoUri || mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'La base de données est indisponible.' });
  }

  try {
    const item = await Item.create({
      name: name.trim(),
      description: description?.trim() ?? '',
    });
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Le corps de la requête doit contenir un JSON valide.' });
  }

  console.error('Erreur API :', error);
  return res.status(500).json({ error: 'Une erreur interne est survenue.' });
});

if (mongoUri) {
  mongoose.connect(mongoUri).catch((error) => {
    console.error('Connexion à MongoDB impossible :', error);
  });
}

app.listen(port, () => {
  console.log(`Serveur à l'écoute sur le port ${port}.`);
});