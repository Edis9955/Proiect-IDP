const express = require('express');
const zlib = require('zlib');
const app = express();

app.use(express.json());

app.post('/validate', (req, res) => {
    try {
        let { data } = req.body;
        
        // Clean the string to ensure no extra whitespace/newlines
        data = data.trim();
        if (!data || data[0] !== '0') {
            return res.status(400).send({ isValid: false, error: 'Invalid version byte' });
        }

        // Remove version byte and decode Base64
        const buffer = Buffer.from(data.slice(1), 'base64');
        
        // Decompress Zlib
        zlib.inflate(buffer, (err, decompressed) => {
            if (err) {
                return res.status(400).send({ isValid: false, error: 'Zlib decompression failed' });
            }
            
            // Parse JSON to ensure it's a valid blueprint structure
            const blueprintJson = JSON.parse(decompressed.toString());
            console.log("Validated Blueprint:", blueprintJson.blueprint?.item);

            res.status(200).send({ 
                isValid: true, 
                content: blueprintJson 
            });
        });
    } catch (error) {
        res.status(500).send({ isValid: false, error: error.message });
    }
});

if (require.main === module) {
    app.listen(3000, () => console.log('Validator Service running on port 3000'));
}

module.exports = app;