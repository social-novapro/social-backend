const router = require('express').Router();
const { getAdmins } = require('../../../../utils/admin/util');

router.get('/', async (req, res) => {
    const requests = await getAdmins({adminID: req.headers.userid});
    if (requests.error) return res.status(400).send(requests);
    return res.status(200).send(requests);
});

module.exports = router;
