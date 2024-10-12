const { getComponents, uploadArticle } = require('../../../../../utils/articles/create');

const router = require('express').Router();

router.post('/', async (req, res) => {
    console.log(req.body)
    const articleUploaded = await uploadArticle(req.headers.userid, req.body.article, req.body.method);
    return res.status(200).send(articleUploaded);
})

module.exports = router;