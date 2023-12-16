const router = require('express').Router();
const { approveCopost } = require('../../../../../utils/post/coposter');

router.post('/:requestID', async (req, res) => {
    const { requestID } = req.params;
    const { userid: userID } = req.headers;

    const approved = await approveCopost({ requestID, userID });
    if (approved.error) return res.status(400).send(approved);
    else return res.status(200).send(approved);
})

module.exports = router;
