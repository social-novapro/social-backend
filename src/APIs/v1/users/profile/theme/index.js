const router = require('express').Router();
const { 
    possibleThemes, 
    createTheme, 
    editTheme, 
    getTheme, 
    getUserThemes, 
    getCurrentTheme, 
    setUserTheme,
    changeThemeName
} = require('../../../../../utils/user/editUser');

/* get possible options */
router.get('/possible', (req, res) => {
    return res.status(200).send(possibleThemes);
})

/* submits create of a theme */
router.post('/submit/create', async (req, res) => {
    const userID = req.headers.userid;

    const { name, privacy, forkID } = req.body;
    
    const done = await createTheme({ 
        userID, 
        name: name ? name : "Untitled Theme",
        privacy: privacy ? privacy : 1,
        forkID: forkID ? forkID : null
    });

    if (done.error) return res.status(400).send(done);
    return res.status(200).send(done);
});

/* submits changes to theme */
router.put('/submit/:themeID', async (req, res) => {
    const userID = req.headers.userid;
    const themeID = req.params.themeID;

    const done = await editTheme({ 
        userID, 
        options: req.body, 
        themeID,
    });

    if (done.error) return res.status(400).send(done);
    return res.status(200).send(done);
});

/* forks a theme, could also use /submit/create with a forkID */
router.post('/fork/:themeID', async (req, res) => {
    const userID = req.headers.userid;
    const themeID = req.params.themeID;

    // can set name afterwards
    const done = await createTheme({ 
        userID, 
        forkID: themeID,
    });

    if (done.error) return res.status(400).send(done);
    return res.status(200).send(done);
});

/* sets theme for user */
router.post('/set/:themeID', async (req, res) => {
    const { themeID } = req.params;
    const userID = req.headers.userid;

    const done = await setUserTheme({ userID, themeID });
    if (done.error) return res.status(400).send(done);
    return res.status(200).send(done);
});

/* gets current user's themes */
router.get('/user/', async (req, res) => {
    const userID = req.headers.userid;

    const result = await getCurrentTheme({userID});
    if (result.error) return res.status(400).send(result);
    else return res.status(200).send(result);
});

/* get a users themes */
router.get('/user/:userID', async (req, res) => {
    const {userID} = req.params;
    const requestingUser = req.headers.userid;

    const result = await getUserThemes({userID, requestingUser});
    if (result.error) return res.status(400).send(result);
    else return res.status(200).send(result);
});

/* get any theme */
router.get('/:themeID', async (req, res) => {
    const requestingUser = req.headers.userid;
    const {themeID} = req.params;

    const result = await getTheme({themeID, requestingUser});
    if (result.error) return res.status(400).send(result);
    else return res.status(200).send(result);
})


module.exports = router;
