const router = require('express').Router();
const latest = require('./latest');
const list = require('./list');

const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const alertFunctions  = require('../../../../utils/alerts/');

router.use('/latest', latest);
router.use('/list', list);

router.get('/:alertID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { alertID } = req.params;
    const alert = await alertFunctions.getAlert({ alertID });
    if (alert.error) return res.status(400).send(alert);
    return res.status(200).send(alert)
});

module.exports = router;
