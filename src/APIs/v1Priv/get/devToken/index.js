const router = require('express').Router();
const developerToken = require('../../../../schemas/developer/developerToken/');
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.get('/:devtoken', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { devtoken } = req.params;

    if (!devtoken) return res.status(403).send(searchError("E008"));
    const devTokenFound = await developerToken.findOne({_id: devtoken});
    if (!devTokenFound) return res.status(403).send(searchError("E007"));

    res.status(200).send(devTokenFound);
})

module.exports = router;