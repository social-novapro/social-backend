const router = require('express').Router();
const { searchErrorV2 } = require('../../../../utils/searchError');

router.get('/', async (req, res) => {
    return res.status(400).send(searchErrorV2("I001", { userID: req.headers.userid }));
})

module.exports = router;