const { resolveError } = require('../../../../../utils/admin/errors');
const router = require('express').Router();

router.post('/:errorID', async (req, res) => {
    const { userid: userID } = req.headers;
    const { errorID } = req.params;

    const resolved = await resolveError({ errorID, adminID: userID });
    
    if (resolved.error) return res.status(400).send(resolved);
    return res.status(200).send(resolved);
});

module.exports = router;
