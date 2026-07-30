const router = require('express').Router();
const { snapshot } = require('../../../utils/capabilities');

router.get('/', async (req, res) => {
    const capabilities = snapshot();
    const state = Object.values(capabilities).some((value) => value !== 'available') ? 'degraded' : 'online';
    return res.status(200).send({ status: "online", state, capabilities });
})

module.exports = router;
