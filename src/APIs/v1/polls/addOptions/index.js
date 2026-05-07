const router = require('express').Router();
const { searchErrorV2 } = require('../../../../utils/searchError');
const { createNewPollOption, findPoll } = require('../../../../utils/polls');

router.post('/', async (req, res) => {
    // optionAmount = number of options
    // option_#num = option title
    const userID = req.headers.userid;
    const { optionAmount, pollID } = req.body;
    if (!pollID) return res.status(400).send(searchErrorV2("O012", { userID }))

    const pollExists = await findPoll({ pollID, userID });
    if (pollExists.error) return res.status(404).send(pollExists)

    var options = [];

    for (var i = 0; i < optionAmount; i++) {
        if (!req.body[`option_${i+1}`]) return res.status(400).send(searchErrorV2("O013", { userID }));
        
        const optionTitle = req.body[`option_${i+1}`];

        const newOption = await createNewPollOption({ userID, pollID, optionTitle})
        options.push(newOption)
    }

    const foundPoll = await findPoll({ pollID, userID });
    if (!options[0]) return res.status(400).send(searchErrorV2("O014", { userID }));
    else return res.status(200).send({ finalPoll: foundPoll, addedOptions: options, oldPoll: pollExists});
});

module.exports = router;
