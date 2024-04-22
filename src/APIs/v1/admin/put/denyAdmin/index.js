const router = require('express').Router();
const interactUserSchema = require('../../../../../schemas/interactUserSchema');
const {checkUserPerms} = require('../../../../../utils/checkUserPerms');
const interactVerifyRequests = require('../../../../../schemas/interactVerifyRequests');
const interactVerificationSchema = require('../../../../../schemas/interactVerificationSchema');

router.put('/:userid', async (req, res) => {
    const userPerms = await checkUserPerms(req.headers.userid);
    if (userPerms.admin == false) return res.status(401).send({error: "You do not have permission to access this resource."});
    else if (userPerms.adminType < 2) return res.status(401).send({error: "You do not have permission to access this resource."});

    const userid = req.params.userid;

    // adding stuff to database
    const foundRequest = await interactVerifyRequests.findOne({_id: userid});
    if (!foundRequest) return res.status(404).send({error: "No request found for this user."});

    const alreadyAccepted = await interactVerificationSchema.findOne({_id: userid});
    if (alreadyAccepted) return res.status(400).send({error: "This user has already been verified."});
    

    await interactVerifyRequests.findOneAndUpdate({
        _id: userid
    }, {
        status: "denied"
    });
    
    const deniedRequest = await interactVerifyRequests.findOne({_id: userid});
    if (!deniedRequest?.status=='denied') return res.status(404).send({"error": "error saving status to database."});
    return res.status(200).send(deniedRequest);
});

module.exports = router;
