const router = require('express').Router();
const { findErrorIssue } = require('../../../../../utils/admin/errors');

router.get('/:errorID', async (req, res) => {
    const { errorID } = req.params;
    
    const foundIssue = await findErrorIssue({ errorID, adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);

    return res.status(200).send(foundIssue);
});

module.exports = router;
