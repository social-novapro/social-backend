const { checktime } = require('../checktime');
const { searchError } = require('../searchError');
const { v4: uuidv4 } = require('uuid');

const interactPollSchema = require('../../schemas/polls/interactPollSchema');
const interactPollVoteSchema = require('../../schemas/polls/interactPollVoteSchema');
const interactPollVoteIndexSchema = require('../../schemas/polls/interactPollVoteIndexSchema');

// logic behind creating polls
async function createPoll({ userID, pollOptions }) {
    const { pollName, timeLive, options } = pollOptions;
    if (!pollName) return { error: "no poll name" }
    if (!options) return { error: "no options" }

    const pollData = await createPollDB({ userID, pollName, timeLive: timeLive || 86400000 });
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

// adds poll to database
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

// adds poll option to poll
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

// change title of poll
async function editPollTitle({ userID, pollID, pollName }) {
    const pollFound = await interactPollSchema.findOne({ _id: pollID });
    if (!pollFound) return { error: "no poll found" };
    if (pollFound.timestampEnding < checktime()) return { error: "poll has ended" };
    if (pollFound.lastEdited) {
        if (pollFound.lastEdited + 1800000 > checktime()) return { error: "poll has been edited too recently" };
    }
    if (pollFound.userID != userID) return { error: "user not authorized" };

    await interactPollSchema.findOneAndUpdate({ 
        _id: pollID 
    }, { 
        pollName,
        lastEdited: checktime(), 
    }, { 
        upsert: true,
    });

    const newPoll = await interactPollSchema.findOne({ _id: pollID });
    return { updatedPoll: newPoll, oldPoll: pollFound };
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

// findPoll
async function findPoll({ pollID }) {
    const pollFound = await interactPollSchema.findOne({ _id: pollID });
    if (!pollFound) return { error: "no poll found" };
    return pollFound;
}

module.exports = {
    createPoll,
    editPollTitle,
    findPoll,
}