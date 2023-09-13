const router = require('express').Router();
const { editTheme, getThemes, possibleThemes } = require('../../../../../utils/user/editUser');

router.put('/submit', async (req, res) => {
    const userID = req.headers.userid;

    const done = await editTheme({ userID, options: req.body });
    if (done.error) return res.status(400).send(done);
    return res.status(200).send(done);
});

router.get('/possible', (req, res) => {
    return res.status(200).send(possibleThemes);
})

router.get('/:userID', async (req, res) => {
    const {userID} = req.params;

    const result = await getThemes({userID});
    if (result.error) return res.status(400).send(result);
    else return res.status(200).send(result);
});


module.exports = router;
