const { reviewError } = require('../../../../../utils/admin/errors');
const router = require('express').Router();

router.post('/:errorID', async (req, res) => {
    const { userid: userID } = req.headers;
    const { errorID } = req.params;

    const reviewing = await reviewError({ errorID, adminID: userID });
    
    if (reviewing.error) return res.status(400).send(reviewing);
    return res.status(200).send(reviewing);
});

module.exports = router;
