const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');

router.delete('/:notificationID', async (req, res) => {
    return res.status(400).send(searchError("I006"));
})

module.exports = router;
