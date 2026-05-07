const router = require('express').Router();
const { updateUserCategory, getUserCategories } = require('../../../../utils/post/categories');
const { searchErrorV2 } = require('../../../../utils/searchError');

router.get('/', async (req, res) => {
    const categoriesFound = await getUserCategories({ userID: req.headers.userid });
    
    if (categoriesFound.error) return res.status(400).send(categoriesFound);
    return res.status(200).send(categoriesFound);
});

router.post('/', async (req, res) => {
    const { userid: userID } = req.headers;
    const { categoryID, value } = req.body;
    if (!categoryID || !value) return res.status(400).send(searchErrorV2("Q027", { userID }));
   
    const updated = await updateUserCategory({ userID, categoryID, value, type: "userScore" });
    if (updated.error) return res.status(400).send(updated);

    return res.status(200).send(updated);
});

/*
// unused, but will reimplement later
router.post('/restore', async (req, res) => {
    const { userid: userID } = req.headers;
    
    const restoreCategories = await restoreUserCategories({ userID, body: req.body });
    if (restoreCategories.error) return res.status(400).send(restoreCategories);
    return res.status(200).send(restoreCategories)
});

// unused, but will reimplement later
router.delete('/reset', async (req, res) => {
    const { userid: userID } = req.headers;
    
    const removedCategories = await resetUserCategories({ userID, categoryID, value });
    if (removedCategories.error) return res.status(400).send(removedCategories);
    return res.status(200).send(removedCategories);
});
*/

module.exports = router;
