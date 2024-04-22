const router = require('express').Router();
const { searchErrorV2 } = require('../../../../utils/searchError');
const { editPollTitle } = require('../../../../utils/polls');

router.put('/', async (req, res) => {
    const userID = req.headers.userid;
    const { pollName, pollID } = req.body;

    if (pollName) {
        const editPoll = await editPollTitle({ userID, pollName, pollID });
        if (editPoll.error) return res.status(400).send(editPoll)
        else return res.status(200).send(editPoll);
    } else {
        return res.status(400).send(searchErrorV2("O015", { userID }));
    }
});

module.exports = router;
