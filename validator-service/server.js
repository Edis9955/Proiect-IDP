const express = require('express');
const zlib = require('zlib');
const app = express();

// Middleware pentru a parsa body-ul JSON
app.use(express.json());

app.post('/validate', (req, res) => {
    try {
        let { data } = req.body;

        // 1. Verificare existență date
        if (!data) {
            return res.status(400).send({ isValid: false, error: 'No data provided' });
        }

        // 2. Curățare și verificare octet versiune (specific Factorio)
        data = data.trim();
        if (data[0] !== '0') {
            return res.status(400).send({ isValid: false, error: 'Invalid version byte' });
        }

        // 3. Decodare Base64 (sărim peste primul caracter '0')
        const buffer = Buffer.from(data.substring(1), 'base64');
        
        let decompressed;
        try {
            // Factorio folosește de regulă zlib inflate
            decompressed = zlib.inflateSync(buffer);
        } catch (e) {
            try {
                // Fallback pentru formate raw deflate
                decompressed = zlib.inflateRawSync(buffer);
            } catch (e2) {
                return res.status(400).send({ isValid: false, error: 'Zlib decompression failed' });
            }
        }
        
        // 4. Parsare JSON și verificare structură
        let blueprintJson;
        try {
            blueprintJson = JSON.parse(decompressed.toString());
        } catch (e) {
            return res.status(400).send({ isValid: false, error: 'Invalid JSON structure after decompression' });
        }

        // 5. Răspuns de succes
        res.status(200).send({ 
            isValid: true, 
            content: blueprintJson 
        });

    } catch (error) {
        // Eroare neprevăzută (500)
        res.status(500).send({ isValid: false, error: error.message });
    }
});

// Pornire server doar dacă fișierul este rulat direct (nu în teste)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Validator Service running on port ${PORT}`));
}

module.exports = app;