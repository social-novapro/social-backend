const router = require('express').Router();
const { searchError } = require('../../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../../utils/checkRequestTokens');
const { removeEmail } = require('../../../../../utils/email/removeEmail');

router.get('/:emailVerID', async (req, res) => {
    const { emailVerID } = req.params;
    if (!emailVerID) return res.status(400).send(searchError("N001"));
    
    const done = await removeEmail({ emailVerID });

    return res.status(200).send(done);
})

module.exports = router;
