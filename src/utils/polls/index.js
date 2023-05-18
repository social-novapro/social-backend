const { checktime } = require('../checktime');
const { searchError } = require('../searchError');
const { v4: uuidv4 } = require('uuid');

const interactPollSchema = require('../../schemas/polls/interactPollSchema');
const interactPollVoteSchema = require('../../schemas/polls/interactPollVoteSchema');
const interactPollVoteIndexSchema = require('../../schemas/polls/interactPollVoteIndexSchema');

const MAX_AMOUNT_OPTIONS = 10;
const MAX_POLL_TITLE_LENGTH = 150;
const MAX_POLL_OPTION_LENGTH = 50;

/*
    bugs:
    if error occurs with each of the options, itll still make the poll DB, but with no options
    *fixed
*/
// logic behind creating polls
async function createPoll({ userID, pollOptions }) {
    const { pollName, timeLive, options } = pollOptions;
    if (!pollName) return { error: "no poll name" }
    if (!options) return { error: "no options" }

    // must have more than 2 options
    if (options.length < 2) return { error: "not enough options" };
    if (options.length > MAX_AMOUNT_OPTIONS) return { error: "to many options" };

    const validateTitle = validTitle({ type: "poll", title: pollName})
    if (validateTitle.possible==false) return validateTitle;

    const validatedOptions = []
    const foundErrors = []

    // validating options 
    for (const option of options) {
        var foundError = false;
        const { optionTitle } = option;

        const validateTitle = validTitle({ type: "option", title: optionTitle })
        if (validateTitle.possible==false) {
            foundErrors.push(validateTitle);
            foundError=true;
        }
        if (!foundError) validatedOptions.push({optionTitle})
    }

    // must have more than 2 options
    if (validatedOptions.length < 2) return { error: "not enough valid options" };
    if (validatedOptions.length > MAX_AMOUNT_OPTIONS) return { error: "to many valid options" };

    const pollData = await createPollDB({ userID, pollName, timeLive: timeLive || 86400000 });
    if (!pollData) return { error: "no new poll data"}

    var pollOptionsData = [];

    // adding options to db
    for (const option of validatedOptions) {
        const { optionTitle } = option;

        const pollOption = await createPollOptionDB({ pollID: pollData._id, optionTitle });
        if (!pollOption) return { error: "no new poll option data" }
        pollOptionsData.push(pollOption);
    }

    const pollFound = await interactPollSchema.findOne({ _id: pollData._id });

    return { pollData: pollFound, foundErrors };
}

// check if poll can be edited, true=can, false=cant
function canEditPoll({ pollData, userID }) {
    if (pollData.userID != userID) return { possible: false, error: "user not authorized" };
    if (pollData.timestampEnding < checktime()) return { possible: false, error: "poll has ended" };
    if (pollData.lastEdited) {
        if (pollData.lastEdited + 1800000 > checktime()) return { possible: false, error: "poll has been edited too recently" };
    }

    return { possible: true }
}

// create poll option
async function createNewPollOption({ userID, pollID, optionTitle }) {
    if (!pollID) return { error: "Please provide pollID"}
    if (!optionTitle) return { error: "no optiontitle"}
    
    const pollData = await interactPollSchema.findOne({ _id: pollID });
    if (!pollData) return { error: "no poll found" };
    if (pollData.pollOptions.length > MAX_AMOUNT_OPTIONS) return { error: "To many options"}

    const canEdit = canEditPoll({ pollData, userID })
    if (canEdit.possible==false) return canEdit;
    
    const pollOption = await createPollOptionDB({ pollID, optionTitle })
    return pollOption;
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

// validate titles
function validTitle({ type, title }) {
    if (!title) return { possible: false, error: "title was not sent to validation" };
    const titleLength = title.length;
    if (!type || type == "option") {
        if (titleLength > MAX_POLL_OPTION_LENGTH) return { 
            possible: false, 
            error: `option title is to long, please be under ${MAX_POLL_OPTION_LENGTH} characters, message was: ${titleLength} characters.`,
            relatedTo: title,
        }
        else return { possible: true }

    }
    else if (type == "poll") {
        if (titleLength > MAX_POLL_TITLE_LENGTH) return { 
            possible: false, 
            error: `poll title is to long, please be under ${MAX_POLL_TITLE_LENGTH} characters, message was: ${titleLength} characters.`,
            relatedTo: title,
        }
        else return { possible: true }
    }
    else return { 
        possible: false,
        error: "an unknown eror from validating titles. possibly the type name.", 
        relatedTo: title
    }
}

// delete poll
async function deletePoll({ userID, pollID }) {
    const pollFound = await interactPollSchema.findOne({ _id: pollID });
    if (!pollFound) return { error: "no poll found" };

    if (pollFound.userID != userID) return { error: "You are not the owner of this poll." }

    // finding each option
    for (const option of pollFound.pollOptions) {
        if (option.currentIndexID) {
            await deletePollIndex({ indexID: option.currentIndexID });
        }
    }

    await interactPollSchema.findOneAndDelete({ _id: pollID });
}

// delete poll indexes
async function deletePollIndex({ indexID }) {
    const voteIndex = await interactPollVoteIndexSchema.findOne({ _id: indexID })
    if (voteIndex.previousIndexID) {
        await deletePollIndex({ indexID: voteIndex.previousIndexID })
    } 
    if (voteIndex.nextIndexID) {
        await deletePollIndex({ indexID: voteIndex.previousIndexID })
    }
    if (voteIndex.index && voteIndex.index[0]._id) {
        for (const vote of voteIndex.index) {
            console.log("delete vote")
            console.log(vote)
            await deleteVote({ voteID: voteIndex.index })
        }
    }
}

// delete assoicated votes
async function deleteVote({ voteID }) {
    const voteData = await interactPollVoteSchema.findOne({ _id: voteID });
    if (!voteData) return { error: "vote data not found"}

    await interactPollVoteSchema.findOneAndDelete({ _id: voteID });
}

// change title of poll
async function editPollTitle({ userID, pollID, pollName }) {
    const pollFound = await interactPollSchema.findOne({ _id: pollID });
    if (!pollFound) return { error: "no poll found" };

    const canEdit = canEditPoll({ pollData: pollFound, userID })
    if (canEdit.possible==false) return canEdit;

    const validateTitle = validTitle({ type: "poll", title: pollName})
    if (validateTitle.possible==false) return validateTitle;

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
    deletePoll,
    createNewPollOption
}