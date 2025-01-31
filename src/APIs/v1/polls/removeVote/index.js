const router = require('express').Router();
const { removePollVote } = require('../../../../utils/polls');

router.put('/', async (req, res) => {
    const { pollID, pollOptionID } = req.body;
    const userID = req.headers.userid;

    const newRequest = await removePollVote({ pollID, userID, pollOptionID });

    if (newRequest.error) return res.status(400).send(newRequest);
    else return res.status(200).send(newRequest);
});

module.exports = router;
