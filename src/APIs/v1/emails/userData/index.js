const router = require('express').Router();
const {checkRequestTokens} = require('../../../../utils/checkRequestTokens');
const { getData } = require('../../../../utils/email/getData');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid: userID } = req.headers;
    
    const returnData = await getData(userID);

    return res.status(200).send(returnData);
});

module.exports = router;
