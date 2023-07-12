const router = require('express').Router();
const { demoDelete } = require('../../../../../utils/user/deleteUser');

router.delete('/', async (req, res) => {
    const response = await demoDelete({ username })
    return res.status(200).send(response);
});

module.exports = router;
