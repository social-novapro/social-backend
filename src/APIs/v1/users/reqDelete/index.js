const router = require('express').Router();
const { requestDelete } = require('../../../../utils/user/deleteUser');

router.delete('/', async (req, res) => {
    const userID = req.headers.userid;
    const { password } = req.body;

    const result = await requestDelete({ userID, password });
    if (result.error) return res.status(400).send(result);
    else return res.status(200).send(result);
});

module.exports = router;
