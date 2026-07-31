const router = require('express').Router();
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).send({
            status: "unavailable",
            core: { database: "unavailable" }
        });
    }

    return res.status(200).send({ status: "online" });    
})

module.exports = router;
