const express = require('express');
const fs = require('fs');
const csvParser = require('csv-parser');
const path = require('path');


const app = express();
const PORT = 7000;

// Middleware to parse JSON requests.
app.use(express.json());

// POST endpoint to handle calculate requests.
app.post('/process', async (req, res) => {
    const { file, product } = req.body;
    console.log("Hello");
    console.log("Hello");
    // Validate input
    if (!file || !product) {
        return res.status(400).json({ error: 'Invalid input: "file" and "product" parameters are required.' });
    }
    console.log("From container 2");
    // Construct the file path in the shared volume
    const filePath = path.join('/mahek_PV_dir', file);

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: `File not found: ${file}` });
    }
    console.log("Container 2 next", filePath);
    // Load and parse the CSV file
    try {
        let sum = 0;
        let isValidCSV = false;
        const extension = path.extname(file).toLowerCase();

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('headers', (headers) => {
                const expectedHeaders = ['product', 'amount'];
                // Check if the headers exactly match the expected format
                console.log("in container2")
                if (headers.length !== expectedHeaders.length || !headers.every((header, index) => header.trim() === expectedHeaders[index])) {
                    isValidCSV = false; // Mark as invalid CSV
                    return; // Stop further processing
                }
                isValidCSV = true; // Mark as valid CSV
            })
            .on('data', (row) => {
                console.log("in row", row);
                if (row.product === product && row.amount) {
                    console.log(row, "row");
                    sum += parseFloat(row.amount);
                    console.log(sum, "sum");
                }
            })
            .on('end', () => {
                if (!isValidCSV) {
                    return res.status(400).json({ file, error: 'Input file not in CSV format.' });
                }
                if (extension === '.yml' && sum === 0) {
                    return res.send({
                        file,
                        error: "Input file not in CSV format."
                    });
                }
                res.status(200).json({ file, sum });
            })
            .on('error', (err) => {
                console.error('Error parsing CSV:', err.message);
                res.status(500).json({ error: 'Error parsing CSV file.' });
            });
    } catch (error) {
        console.error('Error processing file:', error.message);
        res.status(500).json({ error: 'An unexpected error occurred while processing the file.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Container 2 is listening on http://localhost:${PORT}`);
});
