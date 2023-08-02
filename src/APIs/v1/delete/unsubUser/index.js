const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');

router.delete('/:unsubUserID', async (req, res) => {
    return res.status(400).send(searchError("I005"));
});

module.exports = router;
