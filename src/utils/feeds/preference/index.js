const { subscriptionFeed, allPostsFeed } = require("../");
const interactUserFeedSchema = require("../../../schemas/user/interactUserFeedSchema")
const {checktime} = require('../../checktime');
const { searchError } = require("../../searchError");

const defaultPref = "allPosts";

async function getFeed({ userID }) {
    const pref = await getPreference({ userID });
    const prefData = pref.preferredFeed;
    if (prefData == "allPosts"){
        const feed = await allPostsFeed({ userID });
        return feed;
    } else if (prefData == "subscriptionFeed") {
        const feed = await subscriptionFeed({ userID });
        return feed;
    }
}

/*
    Possible preferences
    full: returns full information
    !full: returns only names
*/
function getPossiblePreferences(full) {
    const possible = [{
        name: "allPosts",
        niceName: "All Posts",
        description: "All posts from all users",
    }, {
        name: "subscriptionFeed",
        niceName: "Subscriptions",
        description: "All posts from users you are subscribed to",
    }];

    if (full) return possible;
    const allowed = [];
    for (const pref of possible) {
        allowed.push(pref.name);
    }

    return allowed;
}

function checkIfValidPreference({ pref }) {
    const allowed = getPossiblePreferences();
    if (allowed.includes(pref)) return true;
    else return searchError("Q002");
}

async function getPreference({ userID }) {
    const foundPref = await interactUserFeedSchema.findOne({ _id: userID });
    
    if (!foundPref) {
        const newPref = await setPreference({ newPref: true, userID, pref: "default" });
        return newPref;
    }
    else return foundPref;
}

async function setPreference({ newPref, userID, pref }) {
    if (!pref) return searchError("Q001");
    
    if (newPref) {
        const newPref = await interactUserFeedSchema.create({
            _id: userID,
            timestamp: checktime(),
            preferredFeed: defaultPref,
        });

        return newPref;
    } else {
        await getPreference({ userID });
        const valid = checkIfValidPreference(pref);
        if (valid.error) return valid;

        if (valid === true) {
            const newPref = await interactUserFeedSchema.findOneAndUpdate({
                _id: userID 
            }, {
                timestamp: checktime(),
                preferredFeed: pref,
            }, {
                new: true,
            });

            return newPref;
        } 
    }
}

module.exports = {
    getFeed,
    getPossiblePreferences,
    getPreference,
    setPreference,
}