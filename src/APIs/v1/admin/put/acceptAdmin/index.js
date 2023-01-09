const router = require('express').Router();
const interactUserSchema = require('../../../../../schemas/interactUserSchema');
const {checkRequestTokens} = require('../../../../../utils/checkRequestTokens');
const {checkUserPerms} = require('../../../../../utils/checkUserPerms');
const { searchError } = require('../../../../../utils/searchError');
const interactAdminRequestSchema = require('../../../../../schemas/admin/interactAdminRequestSchema');
const interactAdminSchema = require('../../../../../schemas/admin/interactAdminSchema');
const { checktime } = require('../../../../../utils/checktime');

router.put('/:userid', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    
    const userPerms = await checkUserPerms(req.headers.userid);
    if (userPerms.admin == false) return res.status(401).send({error: "You do not have permission to access this resource."});
    else if (userPerms.adminType < 2) return res.status(401).send({error: "You do not have permission to access this resource."});

    const userid = req.params.userid;

    // adding stuff to database
    const foundRequest = await interactAdminRequestSchema.findOne({_id: userid});
    if (!foundRequest) return res.status(404).send({error: "No request found for this user."});

    const alreadyAccepted = await interactAdminSchema.findOne({_id: userid});
    if (alreadyAccepted) return res.status(400).send({error: "This user is already admin."});

    await interactAdminSchema.findOneAndUpdate({
        _id: userid
    }, {
        _id: userid,
        content: foundRequest.content,
        timestamp: foundRequest.timestamp,
        acceptedBy: req.headers.userid,
        acceptedTimestamp: checktime()
    }, {
        upsert: true
    });
    
    await interactUserSchema.findOneAndUpdate({
        _id: userid
    }, {
        verified: true
    });

    await interactAdminRequestSchema.findOneAndDelete({_id: userid});
    
    const newVerification = await interactAdminSchema.findOne({_id: userid});
    if (!newVerification) return res.status(404).send({"error": "error saving admin to database."});
    return res.status(200).send(newVerification);
});

module.exports = router;
