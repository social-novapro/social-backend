const router = require('express').Router();
const {checkRequestTokens} = require('../../../../utils/checkRequestTokens');
const { settings } = require('../../../../utils/email/settings/');
const { searchError } = require('../../../../utils/searchError');

router.put('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid: userID } = req.headers;

    const amountOptions = req.body.amountOptions;

    if (!amountOptions) return searchError("N024");
    const foundOptions = [];

    for (var i = 0; i < amountOptions; i++) {
        const option = req.body[`option_${i}`];
        const value = req.body[`value_${i}`];
    
        if (!option || !value) continue;

        foundOptions.push({ option, value });
    }

    if (!foundOptions[0]) return searchError("N025");

    const returnData = await settings({ userID, options: foundOptions });

    return res.status(200).send(returnData);
});

module.exports = router;
