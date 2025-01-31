const router = require('express').Router();
const { getPossiblePreferences } = require('../../../../utils/feeds/preference');

router.get('/', async (req, res) => {
    const possible = getPossiblePreferences(true);
    
    return res.status(200).send(possible);
})

module.exports = router;
