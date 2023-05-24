const { checktime } = require('../checktime');
const { searchError } = require('../searchError');
const { v4: uuidv4 } = require('uuid');

const interactPollSchema = require('../../schemas/polls/interactPollSchema');
const interactPollVoteSchema = require('../../schemas/polls/interactPollVoteSchema');
const interactPollVoteIndexSchema = require('../../schemas/polls/interactPollVoteIndexSchema');

const MIN_AMOUNT_OPTIONS = 2;
const MAX_AMOUNT_OPTIONS = 10;
const MAX_POLL_TITLE_LENGTH = 150;
const MAX_POLL_OPTION_LENGTH = 50;

/*
 up next
    - make amountVoted for pollOptions work  
    - make currentIndexID for pollOptions work
    - make it so it limits changing votes, 
        - only allows changing votes if the poll is still live
        - rate limit
*/

// logic behind creating polls
async function createPoll({ userID, pollOptions }) {
    const { pollName, timeLive, options } = pollOptions;
    if (!pollName) return searchError("O001");
    if (!options) return searchError("O004");

    // must have more than 2 options
    if (options.length < 2) return searchError("O002", [{ name: "min", data: MIN_AMOUNT_OPTIONS }, { name: "max", data: MAX_AMOUNT_OPTIONS }])
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
    if (validatedOptions.length < 2) return {
        error: searchError("O006", [{ name: "min", data: MIN_AMOUNT_OPTIONS }]),
        errors: foundErrors
    }
    if (validatedOptions.length > MAX_AMOUNT_OPTIONS) return searchError("O003", [{ name: "max", data: MAX_AMOUNT_OPTIONS }])

    const pollData = await createPollDB({ userID, pollName, timeLive: timeLive || 86400000 });
    if (!pollData) return { error: "no new poll data"}

    var pollOptionsData = [];

    // adding options to db
    for (const option of validatedOptions) {
        const { optionTitle } = option;

        const pollOption = await createPollOptionDB({ pollID: pollData._id, optionTitle });
        if (!pollOption) return searchError("O007", [{ name : "title", data: optionTitle}])
        pollOptionsData.push(pollOption);
    }

    const pollFound = await interactPollSchema.findOne({ _id: pollData._id });

    return { pollData: pollFound, foundErrors };
}

// check if poll can be edited, true=can, false=cant
function canEditPoll({ pollData, userID }) {
    if (pollData.userID != userID) return { possible: false, error: searchError("O008")};
    if (pollData.timestampEnding < checktime()) return { possible: false, error: searchError("O009") };
    if (pollData.lastEdited) {
        if (pollData.lastEdited + 1800000 > checktime()) return { possible: false, error: searchError("0O10") };
    }

    return { possible: true }
}

// create poll option
async function createNewPollOption({ userID, pollID, optionTitle }) {
    if (!pollID) return { error: searchError("O012") }
    if (!optionTitle) return { error: searchError("O013")}
    
    const pollData = await interactPollSchema.findOne({ _id: pollID });
    if (!pollData) return { error: searchError("O011") };
    if (pollData.pollOptions.length > MAX_AMOUNT_OPTIONS) return { error: searchError("O003", [ { name: "max", data: MAX_AMOUNT_OPTIONS }])}

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
    if (!title) return { possible: false, error: searchError("O016") };
    const titleLength = title.length;

    if (!type || type == "option") {
        if (titleLength >= MAX_POLL_OPTION_LENGTH) return { 
            possible: false, 
            error: searchError("O017", [{"name" : "type", "data" : "Option title" }, { "name" : "max_poll", "data" : MAX_POLL_OPTION_LENGTH }, { "name" : "title_length", "data" : titleLength}]),
            relatedTo: title,
        }
        else return { possible: true }

    }
    else if (type == "poll") {
        if (titleLength >= MAX_POLL_TITLE_LENGTH) return { 
            possible: false, 
            error: searchError("O017", [{"name" : "type", "data" : "Poll title" }, { "name" : "max_poll", "data" : MAX_POLL_TITLE_LENGTH }]),
            relatedTo: title,
        }
        else return { possible: true }
    }
    else return { 
        possible: false,
        error: searchError("O018"), 
        relatedTo: title
    }
}

// delete poll
async function deletePoll({ userID, pollID }) {
    const pollFound = await interactPollSchema.findOne({ _id: pollID });
    if (!pollFound) return { error: searchError("O019")};

    if (pollFound.userID != userID) return { error: searchError("O008") }

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
    if (!pollFound) return { error: searchError("O019")};

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

    // add ID to currentIndexID !!!

    return newPollVoteIndex;
}

async function createPollVote({ pollID, userID, pollOptionID }) {
    // create a proper error
    if (!pollID || !userID || !pollOptionID) return { error: searchError("O014") };

    const foundPoll = await findPoll({ pollID });
    if (foundPoll.error) return foundPoll;

    if (!foundPoll.pollOptions || !foundPoll.pollOptions[0]) return { error: searchError("O020") };
    
    // makes sure its only within poll
    const foundOption = foundPoll.pollOptions.find(option => option._id == pollOptionID);
    if (!foundOption) return { error: searchError("O020") };

    // check if user already voted (if so, change and done)
    const userVoted = await checkUserVote({ userID, pollID });
    if (userVoted.voted) {
        // user already voted for same option
        if (userVoted.foundVote.pollOptionID == pollOptionID) return { error: searchError("O021") };

        const newVote = await changeVoteDB({ userID, pollID, pollOptionID})
        return newVote;
    }

    // find if vote index exists
    if (!foundOption.currentIndexID) {
        const newVoteIndex = await createPollVoteIndex({ pollID, userID});
        const newVote = await createNewVoteDB({ pollID, userID, pollIndexID: newVoteIndex._id, pollOptionID });
        return newVote;
    } else {
        const newVote = await createNewVoteDB({ pollID, userID, pollIndexID: foundOption.currentINdexID, pollOptionID });
        return newVote;
    }
}

// check if user already voted, true or false.
async function checkUserVote({ userID, pollID }) {
    const foundVote = await interactPollVoteSchema.findOne({ userID, pollID });
    if (foundVote) return {
        voted: true,
        foundVote
    }
    return {
        voted: false
    }
}

// change vote in DB
async function changeVoteDB({ userID, pollID, pollOptionID }) {
    const changedVote = await interactPollVoteSchema.findOneAndUpdate({ 
        userID, pollID 
    }, {
        lastEdited: checktime(),
        pollOptionID,
    });

    const { pollVoteID, pollIndexID } = changedVote._id;

    await addVoteToIndexDB({ pollVoteID, pollIndexID});
    await removeVoteToIndexDB({ pollVoteID, pollIndexID});

    return changedVote;
}

// add vote to DB
async function createNewVoteDB({ userID, pollID, pollIndexID, pollOptionID }) {
    const pollVoteID = uuidv4();
    
    const newVote = await interactPollVoteSchema.create({
        _id: pollVoteID,
        pollID,
        userID,
        pollOptionID,
        pollIndexID,
        timestamp: checktime()
    });
    
    await addVoteToIndexDB({ pollVoteID, pollIndexID});
    return newVote;
}

// add vote to index
async function addVoteToIndexDB({ pollVoteID, pollIndexID }) {
    await interactPollVoteIndexSchema.findOneAndUpdate(
        { _id: pollIndexID },
        { $push : { "votes" : { _id: pollVoteID } } }
    );
    // change amountvoted (+1) !!!
}

// remove vote from index
async function removeVoteToIndexDB({ pollVoteID, pollIndexID }) {
    await interactPollVoteIndexSchema.findOneAndUpdate(
        { _id: pollIndexID },
        { $pull : { "votes" : { _id: pollVoteID } } }
    );
    // change amountvoted (-1) !!!
}

// findPoll
async function findPoll({ pollID }) {
    const pollFound = await interactPollSchema.findOne({ _id: pollID });
    if (!pollFound) return { error: searchError("O019")};
    return pollFound;
}

module.exports = {
    createPoll,
    editPollTitle,
    findPoll,
    deletePoll,
    createNewPollOption,
    createPollVote
}