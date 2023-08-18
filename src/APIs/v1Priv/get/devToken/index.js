const router = require('express').Router();
const developerToken = require('../../../../schemas/developer/developerToken/');
const { searchErrorV2 } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.get('/:devtoken', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { devtoken } = req.params;

    if (!devtoken) return res.status(403).send(searchErrorV2("E008", { userID: req.headers.userid }));
    const devTokenFound = await developerToken.findOne({_id: devtoken});
    if (!devTokenFound) return res.status(403).send(searchErrorV2("E007", { userID: req.headers.userid }));

    res.status(200).send(devTokenFound);
})

module.exports = router;