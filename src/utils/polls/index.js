const { checktime } = require('../checktime');
const { searchError } = require('../searchError');
const { v4: uuidv4 } = require('uuid');

const interactPollSchema = require('../../schemas/polls/interactPollSchema');
const interactPollVoteSchema = require('../../schemas/polls/interactPollVoteSchema');
const interactPollVoteIndexSchema = require('../../schemas/polls/interactPollVoteIndexSchema');

async function createPoll({ userID, pollOptions }) {
    const { pollName, timeLive, options } = pollOptions;

    const pollData = await createPollDB({ userID, pollName, timeLive });
    if (!pollData) return { error: "no new poll data"}

    var pollOptionsData = [];

    for (const option of options) {
        const { optionTitle } = option;
        const pollOption = await createPollOptionDB({ pollID: pollData._id, optionTitle });
        if (!pollOption) return { error: "no new poll option data" }
        pollOptionsData.push(pollOption);
    }

    const pollFound = await interactPollSchema.findOne({ _id: pollData._id });

    return { pollFound };
}

async function createPollDB({ userID, pollName, timeLive }) {
    const pollID = uuidv4();

    const newPoll = await interactPollSchema.create({
        _id: pollID,
        userID: userID,
        timestamp: checktime(),
        timestampEnding: Number(checktime()) + Number(timeLive),
        pollName,
    });

    return newPoll;
};

async function createPollOptionDB({ pollID, optionTitle }) {
    const pollOptionID = uuidv4();

    const newPollOption = await interactPollSchema.findOneAndUpdate({ 
        _id: pollID
    },{ 
        $push: { 
            pollOptions: {
                _id: pollOptionID,
                optionTitle,
                timestamp: checktime(),
            }
        }
    });

    return newPollOption;
}

// untested
async function createPollVoteIndex({ pollID, userID }) {
    const pollVoteIndexID = uuidv4();

    const newPollVoteIndex = await interactPollVoteIndexSchema.create({
        _id: pollVoteIndexID,
        pollID,
        userID,
        timestamp: checktime(),
    });

    return newPollVoteIndex;
}

async function createPollVote({ pollID, userID, pollOptionID }) {
    // const pollVoteID = uuidv4();
    // const timestamp = Date.now();
    // const currentIndexID = uuidv4();
}

module.exports = {
    createPoll
}