const { searchErrorV2 } = require('../../../../../utils/searchError');
const router = require('express').Router();

router.get('/:errorCode', async (req, res) => {
    const { errorCode } = req.params;
    const foundErrorCode = searchErrorV2(errorCode, { lookup: true })
    return res.status(200).send(foundErrorCode);
});

module.exports = router;
