const router = require('express').Router();
const {checkUserPerms} = require('../../../../../utils/checkUserPerms');
const interactAdminRequestSchema = require('../../../../../schemas/admin/interactAdminRequestSchema');

router.get('/', async (req, res) => {
    const userPerms = await checkUserPerms(req.headers.userid);
    if (userPerms.admin == false) return res.status(401).send({error: "You do not have permission to access this resource."});
    else if (userPerms.adminType < 2) return res.status(401).send({error: "You do not have permission to access this resource."});

    const requests = await interactAdminRequestSchema.find();
    if (!requests) return res.status(404).send({"error": "No requests found"});
    return res.status(200).send(requests);
});

module.exports = router;
