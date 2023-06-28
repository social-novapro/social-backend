const router = require('express').Router();
const { searchError } = require('../../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../../utils/checkRequestTokens');
const { confirmRemove } = require('../../../../../utils/email/removeEmail');

router.get('/:removeEmailVerID', async (req, res) => {
    const { removeEmailVerID } = req.params;
    if (!removeEmailVerID) return res.status(400).send(searchError("N001"));
    
    const done = await confirmRemove({ removeEmailVerID });
    // add proper errors
    if (!done) return res.status(400).send(done);
    return res.status(200).send(done);
})

module.exports = router;
