const router = require('express').Router();
const {checkRequestTokens} = require('../../../../../utils/checkRequestTokens');
const {checkUserPerms} = require('../../../../../utils/checkUserPerms');
const { searchError } = require('../../../../../utils/searchError');
const interactVerificationSchema = require('../../../../../schemas/interactVerificationSchema');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    
    const userPerms = await checkUserPerms(req.headers.userid);
    if (userPerms.admin == false) return res.status(401).send({error: "You do not have permission to access this resource."});
    else if (userPerms.adminType < 2) return res.status(401).send({error: "You do not have permission to access this resource."});

    const verified = await interactVerificationSchema.find();
    if (!verified) return res.status(404).send({"error": "No requests found"});
    return res.status(200).send(verified);
});

module.exports = router;
