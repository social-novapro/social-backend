const router = require('express').Router();
const { getData } = require('../../../../utils/email/getData');

router.get('/', async (req, res) => {
    const { userid: userID } = req.headers;
    const returnData = await getData(userID);

    return res.status(200).send(returnData);
});

module.exports = router;
