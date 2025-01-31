const router = require('express').Router();
const { findPoll } = require('../../../../utils/polls');

router.get('/:pollID', async (req, res) => {
    const { pollID } = req.params;
    const foundPoll = await findPoll({ pollID, userID: req.headers.userid });

    if (foundPoll.error) return res.status(404).send(foundPoll);
    else return res.status(200).send(foundPoll);
});

module.exports = router;
