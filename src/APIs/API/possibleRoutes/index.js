const router = require('express').Router();
const fs = require('fs');
const path = require('path');

const data = []

router.get('/', async (req, res) => {
    if (!data[0])await readFunctions('../../');
    return res.status(200).send(data);
});

async function readFunctions(dir) {
    const files = fs.readdirSync(path.join(__dirname, dir));
    for (const file of files) {
        const stat = fs.lstatSync(path.join(__dirname, dir, file));
        if (stat.isDirectory()) {
            await readFunctions(path.join(dir, file));
            data.push(`/${dir}/${file}`);
        };
    };
};

module.exports = router;
