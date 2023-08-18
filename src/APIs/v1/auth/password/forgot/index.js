const router = require('express').Router();

router.post('/', async (req, res) => {
    const { userid } = req.headers;
    return res.status(400).send({"error" : "not done"});
})

module.exports = router;
