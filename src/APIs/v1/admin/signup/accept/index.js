const router = require('express').Router();
const { respondAdminRequest } = require('../../../../../utils/admin/util');

router.put('/:requestID', async (req, res) => {
    const denied = await respondAdminRequest({ adminID: req.headers.userid, requestID: req.params.requestID, status: "accept" });
    if (denied.error) return res.status(400).send(denied);
    return res.status(200).send(denied);
});

module.exports = router;
