const router = require('express').Router();
const {checkUserPerms} = require('../../../../../utils/checkUserPerms');
const interactAdminSchema = require('../../../../../schemas/admin/interactAdminSchema');

router.get('/', async (req, res) => {
    const userPerms = await checkUserPerms(req.headers.userid);
    if (userPerms.admin == false) return res.status(401).send({error: "You do not have permission to access this resource."});
    else if (userPerms.adminType < 2) return res.status(401).send({error: "You do not have permission to access this resource."});

    const admins = await interactAdminSchema.find();
    if (!admins) return res.status(404).send({"error": "No requests found"});
    return res.status(200).send(admins);
});

module.exports = router;
