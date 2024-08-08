const express = require('express');
const PocketBase = require('pocketbase/cjs');

const app = express();
const port = 3000;

const pb = new PocketBase('https://db.ta4ha.com');

app.get('/data/:recordId', async (req, res) => {
    try {
        const recordId = req.params.recordId;
        const record = await pb.collection('mearg').getOne(recordId, {
            expand: 'relField1,relField2.subRelField',
        });
        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
