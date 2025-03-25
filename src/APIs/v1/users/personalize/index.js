const router = require('express').Router();
const { getCategories } = require('../../../../utils/post/categories');

router.get('/', async (req, res) => {
    const categoriesFound = await getCategories({ userID: req.headers.userid });
    
    if (categoriesFound.error) return res.status(400).send(categoriesFound);
    return res.status(200).send(categoriesFound);
});

module.exports = router;
