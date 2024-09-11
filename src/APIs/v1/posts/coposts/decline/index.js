const router = require('express').Router();
const { declineCopost } = require('../../../../../utils/post/coposter');

router.delete('/:requestID', async (req, res) => {
    const { requestID } = req.params;
    const { userid: userID } = req.headers;

    const declined = await declineCopost({ requestID, userID });
    if (declined.error) return res.status(400).send(declined);
    else return res.status(200).send(declined);
})

module.exports = router;
