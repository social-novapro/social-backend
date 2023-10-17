const router = require('express').Router();

router.get('/:fileID', async (req, res) => {
    return res.status(200).send("Hello World!");
});

module.exports = router;
