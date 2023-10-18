const { checktime } = require('../checktime');
const { searchError, searchErrorV2 } = require('../searchError');
const { v4: uuidv4 } = require('uuid');

const { SCHEMA_VERSIONS } = require('../../../config.json');

const interactPollSchema = require('../../schemas/polls/interactPollSchema');
const interactPollVoteSchema = require('../../schemas/polls/interactPollVoteSchema');
const interactPollVoteIndexSchema = require('../../schemas/polls/interactPollVoteIndexSchema');

const MIN_AMOUNT_OPTIONS = 2;
const MAX_AMOUNT_OPTIONS = 10;
const MAX_POLL_TITLE_LENGTH = 150;
const MAX_POLL_OPTION_LENGTH = 50;

/*
 up next, v1.1 polls
    - rate limiting for changing votes
    - unlink polls
    - discover page for polls
*/

// logic behind creating polls
async function createPoll({ userID, pollOptions }) {
    const { pollName, timeLive, options } = pollOptions;
    if (!pollName) return searchErrorV2("O001", { userID });
    if (!options) return searchErrorV2("O004", { userID });

    // must have more than 2 options
    if (options.length < 2) return searchErrorV2("O002", { userID, options: [{ name: "min", data: MIN_AMOUNT_OPTIONS }, { name: "max", data: MAX_AMOUNT_OPTIONS }]})
    if (options.length > MAX_AMOUNT_OPTIONS) return searchErrorV2("O003", { userID });

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
        error: searchErrorV2("O006", { userID, options: [{ name: "min", data: MIN_AMOUNT_OPTIONS }]}),
        errors: foundErrors
    }
    if (validatedOptions.length > MAX_AMOUNT_OPTIONS) return searchErrorV2("O003", { userID, options: [{ name: "max", data: MAX_AMOUNT_OPTIONS }]})

    const pollData = await createPollDB({ userID, pollName, timeLive: timeLive || 86400000 });
    if (!pollData) return { error: "no new poll data"}

    var pollOptionsData = [];

    // adding options to db
    for (const option of validatedOptions) {
        const { optionTitle } = option;

        const pollOption = await createPollOptionDB({ pollID: pollData._id, optionTitle });
        if (!pollOption) return searchErrorV2("O007", { userID, options: [{ name : "title", data: optionTitle}]})
        pollOptionsData.push(pollOption);
    }

    const pollFound = await interactPollSchema.findOne({ _id: pollData._id });

    return { pollData: pollFound, foundErrors };
}

// checks if the time is over, possible:false==over, possible:true==not over
function timeOver({ pollData }) {
    if (pollData.timestampEnding < checktime()) return searchError("O009");
    if (pollData.lastEdited) {
        if (pollData.lastEdited + 1800000 > checktime()) return searchError("0O10");
    }
    
    return { possible: true }
}

// check if poll can be edited, possible:true=can, possible:false=cant
function canEditPoll({ pollData, userID }) {
    if (pollData.userID != userID) return { possible: false, error: searchError("O008", { userID })};

    const isTimeOver = timeOver({ pollData });
    if (isTimeOver.error) return isTimeOver;

    return { possible: true }
}

// create poll option
async function createNewPollOption({ userID, pollID, optionTitle }) {
    if (!pollID) return searchErrorV2("O012", { userID });
    if (!optionTitle) return searchErrorV2("O013", { userID });
    
    const pollData = await interactPollSchema.findOne({ _id: pollID });
    if (!pollData) return searchErrorV2("O011", { userID });
    if (pollData.pollOptions.length > MAX_AMOUNT_OPTIONS) return searchErrorV2("O003", {userID, options: [ { name: "max", data: MAX_AMOUNT_OPTIONS }]})

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
        _version: SCHEMA_VERSIONS.polls.interactPollSchema,
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
    if (!pollFound) return searchErrorV2("O019", { userID });

    if (pollFound.userID != userID) return searchErrorV2("O008", { userID });

    // finding each option
    for (const option of pollFound.pollOptions) {
        if (option.currentIndexID) {
            await deletePollIndex({ indexID: option.currentIndexID });
        }
    }

    await interactPollSchema.findOneAndDelete({ _id: pollID });
    return { deletedPoll: pollFound };
}

// delete poll indexes
async function deletePollIndex({ indexID }) {
    const voteIndex = await interactPollVoteIndexSchema.findOne({ _id: indexID })

    // recursion of deleting indexes
    if (voteIndex.previousIndexID) {
        await deletePollIndex({ indexID: voteIndex.previousIndexID })
    } 
    if (voteIndex.nextIndexID) {
        await deletePollIndex({ indexID: voteIndex.previousIndexID })
    }

    // deletes any votes found for option
    if (voteIndex.votes && voteIndex.votes[0]) {
        for (const vote of voteIndex.votes) {
            await deleteVote({ voteID: vote._id })
        }
    }

    // deletes actual index
    await interactPollVoteIndexSchema.findOneAndDelete({ _id: indexID });
    return { deletedIndex: voteIndex }
}

// delete assoicated votes
async function deleteVote({ voteID }) {
    const voteData = await interactPollVoteSchema.findOne({ _id: voteID });
    if (!voteData) return { error: "vote data not found"}

    await interactPollVoteSchema.findOneAndDelete({ _id: voteID });
    return { deletedVote: voteData }
}

// change title of poll
async function editPollTitle({ userID, pollID, pollName }) {
    const pollFound = await interactPollSchema.findOne({ _id: pollID });
    if (!pollFound) return searchErrorV2("O019", { userID });

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

// yea basically
async function createPollVoteIndex({ pollID, userID, pollOptionID }) {
    const pollVoteIndexID = uuidv4();

    const newPollVoteIndex = await interactPollVoteIndexSchema.create({
        _id: pollVoteIndexID,
        _version: SCHEMA_VERSIONS.polls.interactPollVoteIndexSchema,
        pollID,
        userID,
        timestamp: checktime(),
    });
    
    // add ID to currentIndexID !!!
    await interactPollSchema.findOneAndUpdate(
        { _id: pollID, "pollOptions._id": pollOptionID },
        { $set: { "pollOptions.$.currentIndexID": pollVoteIndexID }},
        (err, doc) => {
            if (err) {
                console.log(err)
                console.log("error updating poll option indexID")
            }
        }
    );

    return newPollVoteIndex;
}

// checks if theres already a vote index
async function createPollVote({ pollID, userID, pollOptionID }) {
    // create a proper error
    if (!pollID || !userID || !pollOptionID) return searchErrorV2("O014", { userID : userID ? userID : null });

    const foundPoll = await findPoll({ pollID, userID });
    if (foundPoll.error) return foundPoll;

    const isTimeOver = timeOver({ pollData: foundPoll });
    if (isTimeOver.error) return isTimeOver;

    if (!foundPoll.pollOptions || !foundPoll.pollOptions[0]) return searchErrorV2("O020", { userID });
    
    // makes sure its only within poll
    const foundOption = findOption({ pollData: foundPoll, pollOptionID });
    if (foundOption.error) return foundOption;

    var voteIndexID = null
    if (!foundOption.currentIndexID) {
        const newVoteIndex = await createPollVoteIndex({ pollID, userID, pollOptionID });
        voteIndexID = newVoteIndex._id;
    } else {
        voteIndexID = foundOption.currentIndexID
    };

    // check if user already voted (if so, change and done)
    const userVoted = await checkUserVote({ userID, pollID });
    if (userVoted.voted) {
        // user already voted for same option
        if (userVoted.foundVote.pollOptionID == pollOptionID) return searchErrorV2("O021", { userID });

        // change vote
        const removedVote = await removeVoteDB({ userID, userVote: userVoted.foundVote });
        if (removedVote.error) return removedVote;
        const newVote = await createNewVoteDB({ pollID, userID, pollIndexID: voteIndexID, pollOptionID });

        if (newVote.error) return newVote; // error here
        return { newVote, oldVote: userVoted?.foundVote };
    }
    else {
        const newVote = await createNewVoteDB({ pollID, userID, pollIndexID: voteIndexID, pollOptionID });
        return newVote;
    }
}

// api call to remove a vote
async function removePollVote({ pollID, userID, pollOptionID }) {
    const foundPoll = await findPoll({ pollID, userID });
    if (foundPoll.error) return foundPoll;

    const isTimeOver = timeOver({ pollData: foundPoll });
    if (isTimeOver.error) return isTimeOver;

    if (!foundPoll.pollOptions || !foundPoll.pollOptions[0]) return searchErrorV2("O020", { userID });

    // makes sure its only within poll
    const foundOption = findOption({ pollData: foundPoll, pollOptionID });
    if (foundOption.error) return foundOption;

    // check if user already voted (if so, change and done)
    const userVoted = await checkUserVote({ userID, pollID });
    if (userVoted.error) return userVoted;
    if (userVoted.voted) {
        if (userVoted.foundVote.pollOptionID != pollOptionID) return searchErrorV2("O021", { userID });

        // remove vote
        const removedVote = await removeVoteDB({ userID, userVote: userVoted.foundVote });
        if (removedVote.error) return removedVote;

        return { removedVote };
    } else {
        return userVoted;
    }
}

// removes current user vote
async function removeVoteDB({ userID, userVote }) {
    if (!userVote) return searchErrorV2("O022", { userID });

    const removedVote = await removeVoteToIndexDB({ 
        pollVoteID: userVote._id, 
        pollIndexID: userVote.pollIndexID, 
        pollID: userVote.pollID, 
        pollOptionID: userVote.pollOptionID,
        userID
    });

    if (removedVote?.error) return removedVote;
    
    // deletes vote from user
    const deleteUserVote = await interactPollVoteSchema.findOneAndDelete({ _id: userVote._id });

    return { deleteUserVote };
}

// makes sure its only within poll
function findOption({ pollData, pollOptionID }) {
    if (!pollData || !pollData.pollOptions || !pollData.pollOptions[0]) return { error: "what" };

    const foundOption = pollData.pollOptions.find(option => option._id == pollOptionID);
    if (!foundOption) return searchErrorV2("O020", { userID });
    return foundOption;
}

// proper find user vote
async function findUserVote({ userID, pollID }) {
    const foundPoll = await findPoll({ pollID, userID });
    if (foundPoll.error) return foundPoll;

    // could hide or not from public
    const foundVote = await checkUserVote({ userID, pollID });
    return foundVote;
}

// check if user already voted, true or false.
async function checkUserVote({ userID, pollID }) {
    const foundVote = await interactPollVoteSchema.findOne({ userID, pollID });
    if (foundVote) return {
        voted: true,
        foundVote
    }
    else return {
        voted: false,
        error: searchErrorV2("O024", { userID })
    }
}

// add vote to DB
async function createNewVoteDB({ userID, pollID, pollIndexID, pollOptionID }) {
    const pollVoteID = uuidv4();
    
    const newVote = await interactPollVoteSchema.create({
        _id: pollVoteID,
        _version: SCHEMA_VERSIONS.polls.interactPollVoteSchema,
        pollID,
        userID,
        pollOptionID,
        pollIndexID,
        timestamp: checktime()
    });
    
    if (!newVote) return searchErrorV2("Z002", {userID, options: [{"name": "msg", "data" : "error creating new vote"} ]});

    const addedVote = await addVoteToIndexDB({ pollVoteID, pollIndexID, pollID, pollOptionID, userID });
    if (addedVote?.error) return addedVote;
    return newVote;
}

// add vote to index
async function addVoteToIndexDB({ pollVoteID, pollIndexID, pollID, pollOptionID, userID }) {
    const foundPoll = await findPoll({ pollID, userID });
    if (!foundPoll) return searchErrorV2("O019", { userID });

    const foundOption = findOption({ pollData: foundPoll, pollOptionID });
    if (!foundOption) return foundOption;

    // if (!foundOption.currentIndexID) 
    if (foundOption.currentIndexID != pollIndexID) return searchErrorV2("O022", { userID });

    await interactPollVoteIndexSchema.findOneAndUpdate(
        { _id: pollIndexID },
        { $push : { "votes" : { _id: pollVoteID } } }
    );

    var amountVoted = 0;

    if (!foundOption.amountVoted) amountVoted = foundOption.amountVoted = 1;
    else amountVoted = foundOption.amountVoted + 1;

    await interactPollSchema.findOneAndUpdate(
        { _id: pollID, "pollOptions._id": pollOptionID },
        { $set: { "pollOptions.$.amountVoted": amountVoted }}
    );
}

// remove vote from index
async function removeVoteToIndexDB({ pollVoteID, pollIndexID, pollID, pollOptionID, userID }) {
    const foundPoll = await findPoll({ pollID, userID });
    if (!foundPoll) return searchErrorV2("O019", { userID });

    const foundOption = findOption({ pollData: foundPoll, pollOptionID });
    if (!foundOption) return foundOption;

    if (foundOption.currentIndexID != pollIndexID) return searchErrorV2("O022", { userID });

    await interactPollVoteIndexSchema.findOneAndUpdate(
        { _id: pollIndexID },
        { $pull : { "votes" : { _id: pollVoteID } } }
    );

    var amountVoted = 0;
    
    if (!foundOption.amountVoted) amountVoted = foundOption.amountVoted = 0;
    else if (foundOption.amountVoted == 0) return searchErrorV2("O023", { userID });
    else amountVoted = foundOption.amountVoted - 1;
    
    await interactPollSchema.findOneAndUpdate(
        { _id: pollID, "pollOptions._id": pollOptionID },
        { $set: { "pollOptions.$.amountVoted": amountVoted }}
    );
}

// get all user votes
async function getUserVotes({ userID }) {
    const foundVotes = await interactPollVoteSchema.find({ userID });
    return foundVotes;
}

// findPoll
async function findPoll({ pollID, userID }) {
    const pollFound = await interactPollSchema.findOne({ _id: pollID });
    if (!pollFound) return searchErrorV2("O019", { userID : userID ? userID : null });
    return pollFound;
}

// get any polls from a certian user
async function getPollsFromUser({ userID }) {
    const pollsFound = await interactPollSchema.find({ userID });
    if (!pollsFound) return searchErrorV2("O019", { userID });

    return pollsFound;
}

// delete all user votes
async function deleteUserVotes({ userID }) {
    const foundVotes = await getUserVotes({ userID });
    const returnArr = [];

    for (const vote of foundVotes) {
        const delVote = await removePollVote({ pollID: vote.pollID, userID, pollOptionID: vote.pollOptionID });
        returnArr.push(delVote);
    }

    return returnArr;
}

module.exports = {
    createPoll,
    editPollTitle,
    findPoll,
    deletePoll,
    createNewPollOption,
    createPollVote,
    removePollVote,
    findUserVote,
    getPollsFromUser,
    getUserVotes,
    deleteUserVotes
}