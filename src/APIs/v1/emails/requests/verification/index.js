const router = require('express').Router();
const { searchError } = require('../../../../../utils/searchError');
const { verifyEmail } = require('../../../../../utils/email');

router.post('/:emailVerID', async (req, res) => {
    const { emailVerID } = req.params;
    if (!emailVerID) return res.status(400).send(searchError("N001"));

    const { password } = req.body;
    const done = await verifyEmail({ emailVerID, password });

    if (!done || !done.success || done.error) return res.status(400).send(done);
    return res.status(200).send(done);
})

module.exports = router;
