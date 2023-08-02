const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');

router.get('/', async (req, res) => {
    return res.status(400).send(searchError("I007"));
});

module.exports = router;
