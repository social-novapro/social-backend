const router = require('express').Router();

router.delete('/', async (req, res) => {
    
    return res.status(200).send({returnData: "Hello World"});
});

module.exports = router;
