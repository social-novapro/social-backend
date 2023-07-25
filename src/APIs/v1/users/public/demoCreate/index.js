const router = require('express').Router();
const { demoCreate } = require('../../../../../utils/user/demoCreate');

router.post('/:username', async (req, res) => {
    const { username } = req.params;
    console.log("hi")
    const returnData = await demoCreate({ username });

    return res.status(200).send(returnData);
});

module.exports = router;
