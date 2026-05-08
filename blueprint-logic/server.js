const express = require('express');
const axios = require('axios');
const client = require('prom-client');
const app = express();

const register = new client.Registry();
client.collectDefaultMetrics({ register });

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

const BRIDGE_URL = 'http://persistence-bridge:3000/blueprints';
app.use(express.json());

// Rule: Users must provide a title and a valid string to save
app.post('/api/blueprints/share', async (req, res) => {
    try {
        const { title, blueprintString } = req.body;

        const author = req.headers['x-user-name'] || "Anonymous";
        // Business Rule: Check for minimum title length
        if (!title || title.length < 3) {
            return res.status(400).send({ error: "Title too short" });
        }

        // Business Rule: Forward to Persistence Bridge for validation & storage
        const response = await axios.post(BRIDGE_URL, {
            title,
            blueprintString,
            author: author || "Anonymous"
        });

        res.status(201).send({
            message: "Blueprint shared successfully!",
            id: response.data._id
        });
    } catch (error) {
        // Observability: Check Kibana if the error happened here or in the Bridge
        res.status(error.response?.status || 500).send(error.response?.data || error.message);
    }
});

// Rule: Fetch all blueprints
app.get('/api/blueprints', async (req, res) => {
    try {
        const response = await axios.get(BRIDGE_URL);
        res.send(response.data);
    } catch (error) {
        res.status(500).send("Internal Logic Error");
    }
});


app.get('/api/my-blueprints', async (req, res) => {
    try {
        const currentUser = req.headers['x-user-name'];

        if (!currentUser) {
            return res.status(401).send({ error: "Identity header missing." });
        }

        const response = await axios.get(BRIDGE_URL);
        
        // Ensure we are comparing trimmed, lowercase strings to avoid "Admin" vs "admin" issues
        const userSpecificData = response.data.filter(bp => 
            bp.author?.toLowerCase() === currentUser.toLowerCase()
        );

        res.send(userSpecificData);
    } catch (error) {
        res.status(500).send("Could not retrieve your blueprints");
    }
});


app.delete('/api/blueprints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.headers['x-user-name'];

    // 1. Fetch ONLY the specific blueprint from the bridge
    const getResponse = await axios.get(`${BRIDGE_URL}/${id}`);
    const blueprint = getResponse.data;

    // 2. Security Check: Compare the author
    if (blueprint.author !== currentUser) {
      return res.status(403).send({ error: "Unauthorized: You don't own this!" });
    }

    // 3. Proceed with deletion
    await axios.delete(`${BRIDGE_URL}/${id}`);
    res.send({ message: "Deleted successfully" });
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).send(error.response?.data || "Delete failed");
  }
});


// Start the server only if the file is run directly (not imported for tests)
if (require.main === module) {
    app.listen(3000, () => console.log('Blueprint Logic Service active on port 3000'));
}

module.exports = app;