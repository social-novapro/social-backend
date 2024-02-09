const router = require('express').Router();
const { getAdminDashboard } = require('../../../../utils/admin/dashboard');
const { isUserAdmin } = require('../../../../utils/admin/isAdminUser');

router.get('/', async (req, res) => {
    const {userID: adminID} = req.headers.userid;

    const isAdmin = await isUserAdmin({ adminID });
    if (isAdmin.error) return res.status(400).send(isAdmin);
    
    const returnData = await getAdminDashboard({ adminID });
    return res.status(200).send(returnData);
});

module.exports = router;
