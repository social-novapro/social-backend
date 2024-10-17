const router = require('express').Router();
const { getCurrentArticleIndex } = require('../../../../utils/articles');

router.get('/', async (req, res) => {
    const foundComponents = await getCurrentArticleIndex({ userID: req.headers.userid});
    return res.status(200).send(foundComponents);
})

module.exports = router;