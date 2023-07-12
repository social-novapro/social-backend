const router = require('express').Router();

router.delete('/', async (req, res) => {
    //confirmDelete({ username })
    return res.status(200).send(returnData);
});

module.exports = router;
