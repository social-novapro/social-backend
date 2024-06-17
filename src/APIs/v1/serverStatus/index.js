const router = require('express').Router();

router.get('/', async (req, res) => {
    return res.status(200).send({ status: "online" });    
})

module.exports = router;
