const express = require('express');
const zlib = require('zlib');
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

app.post('/validate', (req, res) => {
    try {
        let { data } = req.body;

        // Check if data exists
        if (!data) {
            return res.status(400).send({ isValid: false, error: 'No data provided' });
        }

        // Clean input and verify version byte (Factorio specific)
        // Factorio blueprint strings always start with a version byte (currently '0')
        data = data.trim();
        if (data[0] !== '0') {
            return res.status(400).send({ isValid: false, error: 'Invalid version byte' });
        }

        const buffer = Buffer.from(data.substring(1), 'base64');
        
        let decompressed;
        try {
            decompressed = zlib.inflateSync(buffer);
        } catch (e) {
            try {
                decompressed = zlib.inflateRawSync(buffer);
            } catch (e2) {
                return res.status(400).send({ isValid: false, error: 'Zlib decompression failed' });
            }
        }
        
        // Parse JSON and verify internal structure
        let blueprintJson;
        try {
            blueprintJson = JSON.parse(decompressed.toString());
        } catch (e) {
            return res.status(400).send({ isValid: false, error: 'Invalid JSON structure after decompression' });
        }

        res.status(200).send({ 
            isValid: true, 
            content: blueprintJson 
        });

    } catch (error) {
        res.status(500).send({ isValid: false, error: error.message });
    }
});


// Start the server only if the file is run directly (not imported for tests)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Validator Service running on port ${PORT}`));
}

module.exports = app;