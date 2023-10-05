const router = require('express').Router();
const { getPostEdits } = require('../../../../utils/post');

router.get('/:postID', async (req, res) => {
    const { postID } = req.params;
    
    const getEdits = await getPostEdits({ postID, userID: req.headers.userid });
    if (getEdits.error) return res.status(403).send(getEdits);
    return res.status(200).send(getEdits);
})

module.exports = router;
