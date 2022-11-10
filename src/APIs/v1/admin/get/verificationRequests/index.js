const router = require('express').Router();
const interactFollowSchema = require('../../../../../schemas/user/interactFollowSchema')
const interactUserSchema = require('../../../../../schemas/interactUserSchema');
const {checkRequestTokens} = require('../../../../../utils/checkRequestTokens');
const {checkUserPerms} = require('../../../../../utils/checkUserPerms');
const { searchError } = require('../../../../../utils/searchError');
const interactVerifyRequests = require('../../../../../schemas/interactVerifyRequests');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    
    // const userPerms = await checkUserPerms(req.headers.userid);
    // if (userPerms.admin == false) return res.status(401).send({error: "You do not have permission to access this resource."});
    
    // if (userPerms.adminType < 2) return res.status(401).send({error: "You do not have permission to access this resource."});

    const requests = await interactVerifyRequests.find();
    if (!requests) return res.status(404).send({"error": "No requests found"});
    return res.status(200).send(requests);
});

module.exports = router;
