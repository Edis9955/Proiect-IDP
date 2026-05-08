const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/blueprints_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB via Bridge'))
  .catch(err => console.error('Bridge connection error:', err));

// Define the Schema for Blueprints [cite: 22]
const BlueprintSchema = new mongoose.Schema({
  title: String,
  blueprintString: String,
  author: String,
  createdAt: { type: Date, default: Date.now }
});

const Blueprint = mongoose.model('Blueprint', BlueprintSchema);

// --- CRUD Operations [cite: 17] ---

// CREATE: Save a new blueprint
app.post('/blueprints', async (req, res) => {
  try {
    const { blueprintString, title, author } = req.body;
    
    // Logic: Bridge calls Validator-Service to check the string 
    const validation = await axios.post('http://validator-service:3000/validate', {
      data: blueprintString 
    });
    const isValid = true;

    // if (isValid) {
    if (validation.data.isValid) {
      const newBP = new Blueprint({ title, blueprintString, author });
      await newBP.save();
      res.status(201).send(newBP);
    } else {
      res.status(400).send({ error: 'Invalid Factorio String' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

// READ: Get all blueprints [cite: 17]
app.get('/blueprints', async (req, res) => {
  const blueprints = await Blueprint.find();
  res.send(blueprints);
});

app.get('/blueprints/:id', async (req, res) => {
  try {
    const blueprint = await Blueprint.findById(req.params.id);
    if (!blueprint) return res.status(404).send("Not found");
    res.send(blueprint);
  } catch (error) {
    res.status(500).send("Invalid ID format");
  }
});


// DELETE: Remove a blueprint by ID
app.delete('/blueprints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Blueprint.findByIdAndDelete(id);
    if (!result) return res.status(404).send("Blueprint not found");
    res.send({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


if (require.main === module) {
    app.listen(3000, () => console.log('Persistence Bridge running on port 3000'));
}

module.exports = app;