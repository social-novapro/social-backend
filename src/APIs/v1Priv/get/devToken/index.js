const router = require('express').Router()
const developerToken = require('../../../../schemas/developer/developerToken/')
const { searchError } = require('../../../../utils/searchError')

router.get('/:devtoken', async (req, res) => {
    const { devtoken } = req.params

    if (!devtoken) return res.status(403).send(searchError("E008"));
    const devTokenFound = await developerToken.findOne({_id: devtoken})
    if (!devTokenFound) return res.status(403).send(searchError("E007"));

    res.status(200).send(devTokenFound);
})

module.exports = router;