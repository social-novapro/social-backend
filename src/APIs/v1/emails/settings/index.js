const router = require('express').Router();
const { settings, possibleOptions } = require('../../../../utils/email/settings/');
const { searchErrorV2 } = require('../../../../utils/searchError');

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
    const { userid: userID } = req.headers;

    const foundOptions = [];
    for (const option of req.body) {
        foundOptions.push(option);
    };
    
    if (!foundOptions[0]) return searchErrorV2("N025", { userID });

    const returnData = await settings({ userID, options: foundOptions });

    return res.status(200).send(returnData);
});

module.exports = router;
