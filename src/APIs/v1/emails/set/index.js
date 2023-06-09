const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema');
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { verifyEmail, sendVerificationEmail } = require('../../../../../utils/email');
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { email } = req.body;
    const { userid } = req.headers;

    if (!email) return res.status(400).send(searchError("N002"));
    

    const { emailVerID } = req.params;
    if (!emailVerID) return res.status(400).send(searchError("N001"));
    
    const done = await verifyEmail(emailVerID);
    // const { userid } = req.headers;

    return res.status(200).send(done);
})

module.exports = router;
