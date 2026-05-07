const router = require('express').Router()
const { newDeveloperAppToken, editDeveloperAppToken } = require('../../../../utils/developer/create/appToken')

router.post('/', async (req, res) => {
    const { userid } = req.headers;
    const { userdevtoken, appname, apporigin} = req.body;

    const createResult = await newDeveloperAppToken(userid, userdevtoken, appname, apporigin);

    if (createResult.error) return res.status(401).send(createResult);
    return res.status(200).send(createResult.data);
});

router.put('/', async (req, res) => {
    const { userid } = req.headers;
    const { appToken, newAppName, newAppOrigin } = req.body;

    const editResult = await editDeveloperAppToken({
        userID: userid,
        appToken,
        newAppName,
        newAppOrigin
    });

    if (editResult.error) return res.status(401).send(editResult);
    return res.status(200).send(editResult.data);
});

module.exports = router;