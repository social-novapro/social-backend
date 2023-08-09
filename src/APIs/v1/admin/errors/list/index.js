const router = require('express').Router();
const { getErrorIssues } = require('../../../../../utils/admin/errors');

router.get('/', async (req, res) => {
    const { userid: userID } = req.headers;

    const results = await getErrorIssues({ adminID: userID })
    if (results.error) return res.status(400).send(results);
    
    return res.status(200).send(results);
});

router.get('/:indexID', async (req, res) => {
    const { userid: userID } = req.headers;
    const { indexID } = req.params;

    const results = await getErrorIssues({ adminID: userID, indexID })
    if (results.error) return res.status(400).send(results);
    
    return res.status(200).send(results);
});

module.exports = router;
