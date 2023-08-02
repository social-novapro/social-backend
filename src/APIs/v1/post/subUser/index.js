const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');

router.post('/:subUserID', async (req, res) => {
    return res.status(400).send(searchError("I004"));
});

module.exports = router;
