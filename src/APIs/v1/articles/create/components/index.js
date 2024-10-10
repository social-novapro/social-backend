const { getComponents } = require('../../../../../utils/articles/create');

const router = require('express').Router();

router.get('/', async (req, res) => {
    const foundComponents = await getComponents();
    return res.status(200).send(foundComponents);
})

module.exports = router;