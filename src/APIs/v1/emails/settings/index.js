const router = require('express').Router();
const {checkRequestTokens} = require('../../../../utils/checkRequestTokens');
const { settings, possibleOptions } = require('../../../../utils/email/settings/');
const { searchError } = require('../../../../utils/searchError');

/**
 * get possible email settings
 */
router.get('/', async (req, res) => {
    return res.status(200).send(possibleOptions);
});

/**
 * Update email settings
 */
router.put('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { userid: userID } = req.headers;

    const foundOptions = [];
    for (const option of req.body) {
        foundOptions.push(option);
    };
    
    if (!foundOptions[0]) return searchError("N025");

    const returnData = await settings({ userID, options: foundOptions });

    return res.status(200).send(returnData);
});

module.exports = router;
