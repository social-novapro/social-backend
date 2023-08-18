const router = require('express').Router();
const { searchErrorV2 } = require('../../../../utils/searchError');

router.delete('/:unsubUserID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I005", { userID: req.headers.userid }));
});

module.exports = router;
