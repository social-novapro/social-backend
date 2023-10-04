const { searchErrorV2 } = require('../../../../utils/searchError');
const router = require('express').Router();

router.get('/:postID', async (req, res) => {
    return res.status(400).send(searchErrorV2('I009', { userID: req.headers.userid }))
})

module.exports = router;