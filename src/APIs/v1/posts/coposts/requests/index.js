const router = require('express').Router();
const { getCopostRequests } = require('../../../../../utils/post/coposter');

router.get('/', async (req, res) => {
    const { userid: userID } = req.headers;

    const requests = await getCopostRequests({ userID });
    if (requests.error) return res.status(400).send(requests);
    else return res.status(200).send(requests);
})

module.exports = router;
