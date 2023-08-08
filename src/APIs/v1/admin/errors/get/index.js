const router = require('express').Router();
const { findErrorIssue } = require('../../../../../utils/admin/errors');

router.get('/:errorID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { errorID } = req.params;
    
    const foundIssue = await findErrorIssue({ errorID, adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);

    return res.status(200).send(deniedRequest);
});

module.exports = router;
