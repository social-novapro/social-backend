const router = require('express').Router();
const interactUserSchema = require('../../../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../../../schemas/interactUserPrivSchema');
const { searchError } = require('../../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../../utils/checkRequestTokens');
const { verifyEmail } = require('../../../../../utils/email');

router.get('/:emailVerID', async (req, res) => {
    const { emailVerID } = req.params;
    if (!emailVerID) return res.status(400).send(searchError("N001"));
    
    const done = await verifyEmail(emailVerID);
    // const { userid } = req.headers;

    return res.status(200).send(done);
})

module.exports = router;
