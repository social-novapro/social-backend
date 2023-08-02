const { checktime } = require('../checktime');
const { searchError } = require('../searchError');
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
    if (!pollName) return searchError("O001");
    if (!options) return searchError("O004");

    // must have more than 2 options
    if (options.length < 2) return searchError("O002", [{ name: "min", data: MIN_AMOUNT_OPTIONS }, { name: "max", data: MAX_AMOUNT_OPTIONS }])
    if (options.length > MAX_AMOUNT_OPTIONS) return searchError("O003");

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

// checks if the time is over, possible:false==over, possible:true==not over
function timeOver({ pollData }) {
    if (pollData.timestampEnding < checktime()) return { possible: false, error: searchError("O009") };
    if (pollData.lastEdited) {
        if (pollData.lastEdited + 1800000 > checktime()) return { possible: false, error: searchError("0O10") };
    }
    
    return { possible: true }
}

// check if poll can be edited, possible:true=can, possible:false=cant
function canEditPoll({ pollData, userID }) {
    if (pollData.userID != userID) return { possible: false, error: searchError("O008")};

    const isTimeOver = timeOver({ pollData });
    if (isTimeOver.possible==false) return isTimeOver;

    return { possible: true }
}

// create poll option
async function createNewPollOption({ userID, pollID, optionTitle }) {
    if (!pollID) return searchError("O012");
    if (!optionTitle) return searchError("O013");
    
    const pollData = await interactPollSchema.findOne({ _id: pollID });
    if (!pollData) return searchError("O011");
    if (pollData.pollOptions.length > MAX_AMOUNT_OPTIONS) return searchError("O003", [ { name: "max", data: MAX_AMOUNT_OPTIONS }])

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
    if (!pollFound) return searchError("O019");

    if (pollFound.userID != userID) return searchError("O008");

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
    if (!pollFound) return searchError("O019");

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
    if (!pollID || !userID || !pollOptionID) return searchError("O014");

    const foundPoll = await findPoll({ pollID });
    if (foundPoll.error) return foundPoll;

    const isTimeOver = timeOver({ pollData: foundPoll });
    if (isTimeOver.possible == false) return isTimeOver;

    if (!foundPoll.pollOptions || !foundPoll.pollOptions[0]) return searchError("O020");
    
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
        if (userVoted.foundVote.pollOptionID == pollOptionID) return searchError("O021");

        // change vote
        const removedVote = await removeVoteDB({ userID, userVote: userVoted.foundVote });
        if (removedVote.error) return { error: removedVote.error };
        const newVote = await createNewVoteDB({ pollID, userID, pollIndexID: voteIndexID, pollOptionID });

        if (newVote.error) return { error: newVote }; // error here
        return { newVote, oldVote: userVoted?.foundVote };
    }
    else {
        const newVote = await createNewVoteDB({ pollID, userID, pollIndexID: voteIndexID, pollOptionID });
        return newVote;
    }
}

// api call to remove a vote
async function removePollVote({ pollID, userID, pollOptionID }) {
    const foundPoll = await findPoll({ pollID });
    if (foundPoll.error) return foundPoll;

    const isTimeOver = timeOver({ pollData: foundPoll });
    if (isTimeOver.possible == false) return isTimeOver;

    if (!foundPoll.pollOptions || !foundPoll.pollOptions[0]) return searchError("O020");

    // makes sure its only within poll
    const foundOption = findOption({ pollData: foundPoll, pollOptionID });
    if (foundOption.error) return foundOption;

    // check if user already voted (if so, change and done)
    const userVoted = await checkUserVote({ userID, pollID });
    if (userVoted.error) return userVoted.error;
    if (userVoted.voted) {
        if (userVoted.foundVote.pollOptionID != pollOptionID) return searchError("O021");

        // remove vote
        const removedVote = await removeVoteDB({ userVote: userVoted.foundVote });
        if (removedVote.error) return removedVote.error ;

        return { removedVote };
    } else {
        return userVoted.error;
    }
}

// removes current user vote
async function removeVoteDB({ userVote }) {
    if (!userVote) return searchError("O022");

    const removedVote = await removeVoteToIndexDB({ 
        pollVoteID: userVote._id, 
        pollIndexID: userVote.pollIndexID, 
        pollID: userVote.pollID, 
        pollOptionID: userVote.pollOptionID 
    });

    if (removedVote?.error) return { error: removedVote, msg: "removeUserVote() remove" }
    
    // deletes vote from user
    const deleteUserVote = await interactPollVoteSchema.findOneAndDelete({ _id: userVote._id });

    return { deleteUserVote };
}

// makes sure its only within poll
function findOption({ pollData, pollOptionID }) {
    if (!pollData || !pollData.pollOptions || !pollData.pollOptions[0]) return { error: "what" };

    const foundOption = pollData.pollOptions.find(option => option._id == pollOptionID);
    if (!foundOption) return searchError("O020");
    return foundOption;
}

// proper find user vote
async function findUserVote({ userID, pollID }) {
    const foundPoll = await findPoll({ pollID });
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
        error: searchError("O024")
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
    
    if (!newVote) return searchError("Z002", [{"name": "msg", "data" : "error creating new vote"} ]);

    const addedVote = await addVoteToIndexDB({ pollVoteID, pollIndexID, pollID, pollOptionID });
    if (addedVote?.error) return { error: addedVote }
    return newVote;
}

// add vote to index
async function addVoteToIndexDB({ pollVoteID, pollIndexID, pollID, pollOptionID }) {
    const foundPoll = await findPoll({ pollID });
    if (!foundPoll) return searchError("O019");

    const foundOption = findOption({ pollData: foundPoll, pollOptionID });
    if (!foundOption) return foundOption;

    // if (!foundOption.currentIndexID) 
    if (foundOption.currentIndexID != pollIndexID) return searchError("O022");

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
async function removeVoteToIndexDB({ pollVoteID, pollIndexID, pollID, pollOptionID }) {
    const foundPoll = await findPoll({ pollID });
    if (!foundPoll) return searchError("O019");

    const foundOption = findOption({ pollData: foundPoll, pollOptionID });
    if (!foundOption) return foundOption;

    if (foundOption.currentIndexID != pollIndexID) return searchError("O022");

    await interactPollVoteIndexSchema.findOneAndUpdate(
        { _id: pollIndexID },
        { $pull : { "votes" : { _id: pollVoteID } } }
    );

    var amountVoted = 0;
    
    if (!foundOption.amountVoted) amountVoted = foundOption.amountVoted = 0;
    else if (foundOption.amountVoted == 0) return searchError("O023");
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
async function findPoll({ pollID }) {
    const pollFound = await interactPollSchema.findOne({ _id: pollID });
    if (!pollFound) return searchError("O019");
    return pollFound;
}

// get any polls from a certian user
async function getPollsFromUser({ userID }) {
    const pollsFound = await interactPollSchema.find({ userID });
    if (!pollsFound) return searchError("O019");

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