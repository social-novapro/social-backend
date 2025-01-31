const router = require('express').Router();
const { searchErrorV2 } = require('../../../../utils/searchError');
const { createPoll } = require('../../../../utils/polls');

router.post('/', async (req, res) => {
    const userID = req.headers.userid;

    // optionAmount = number of options
    // option_#num = option title
    const { pollName, timeLive, optionAmount } = req.body;
    var options = [];
    for (var i = 0; i < optionAmount; i++) {
        if (!req.body[`option_${i+1}`]) return res.status(400).send(searchErrorV2("O005", { userID, options: [{ name: "optionNum", data: `#${i+1}`}] }));
        options.push({ optionTitle: req.body[`option_${i+1}`] });
    }

    const newPoll = await createPoll({ userID, pollOptions: { pollName, timeLive, options }});
    if (newPoll.error) return res.status(400).send(newPoll);
    if (!newPoll) return res.status(404).send(searchErrorV2("O014", { userID }));
    else return res.status(200).send(newPoll);
});

module.exports = router;
