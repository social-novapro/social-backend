const router = require('express').Router();
const interactUserSchema = require('../../../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../../../schemas/interactUserPrivSchema');
const { searchError } = require('../../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../../utils/checkRequestTokens');
const { validEmail } = require('../../../../../utils/email');

router.get('/:email', async (req, res) => {
    const { email } = req.params;
    if (!email) return res.status(400).send(searchError("N004"));
    
    const done = validEmail({email});
    // const { userid } = req.headers;

    return res.status(200).send(done);
})

module.exports = router;
