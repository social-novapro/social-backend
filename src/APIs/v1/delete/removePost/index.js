const router = require('express').Router();
const { searchErrorV2 } = require('../../../../utils/searchError');

router.delete('/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2("I013", {userID: req.headers.userid}));
})

module.exports = router;
