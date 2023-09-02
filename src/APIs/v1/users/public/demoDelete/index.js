const router = require('express').Router();
const { demoDelete } = require('../../../../../utils/user/deleteUser');

router.delete('/:username', async (req, res) => {
    const { username } = req.params;

    const response = await demoDelete({ username });
    return res.status(200).send(response);
});

module.exports = router;
