const router = require('express').Router();
const { searchErrorV2 } = require('../../../../utils/searchError');
const { deletePoll } = require('../../../../utils/polls');

router.delete('/:pollID', async (req, res) => {
    const userID = req.headers.userid;
    const { pollID } = req.params;

    const newPoll = await deletePoll({ userID, pollID });
    if (!newPoll) return res.status(404).send(searchErrorV2("O014", { userID }));
    else if (newPoll.error) return res.status(400).send(newPoll.error);
    else return res.status(200).send(newPoll);
});

module.exports = router;
