const { subscriptionFeed, allPostsFeed, allPostsFeedV2, subscriptionFeedV2 } = require("../");
const interactUserFeedSchema = require("../../../schemas/user/interactUserFeedSchema")
const {checktime} = require('../../checktime');
const { searchError, searchErrorV2 } = require("../../searchError");
const { buildPersonalizedFeed } = require("../personalized");

const defaultPref = "personal";

async function getFeed({ userID }) {
    if (!userID) return searchError("B009")

    const pref = await getPreference({ userID });
    const prefData = pref.preferredFeed;
    if (prefData == "allPosts"){
        const feed = await allPostsFeed({ userID });
        return feed;
    } else if (prefData == "subscriptionFeed") {
        const feed = await subscriptionFeed({ userID  });
        return feed;
    } else if (prefData == "personal") {
        const feed = await buildPersonalizedFeed({ userID, indexID });
        return feed;
    }
}

async function getFeedV2({ userID, indexID }) {
    if (!userID) return searchError("B009")

    const pref = await getPreference({ userID });
    const prefData = pref.preferredFeed;
    if (prefData == "allPosts"){
        const feed = await allPostsFeedV2({ userID, indexID });
        return feed;
    } else if (prefData == "subscriptionFeed") {
        const feed = await subscriptionFeedV2({ userID });
        return feed;
    } else if (prefData == "personal") {
        const feed = await buildPersonalizedFeed({ userID, indexID });
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
        name: "userFeed",
        speical: true,
        niceName: "Default",
        description: "Default set by user"
    }, {
        name: "allPosts",
        niceName: "All Posts",
        description: "All posts from all users",
    }, {
        name: "subscriptionFeed",
        niceName: "Subscriptions",
        description: "All posts from users you are subscribed to",
    }, {
        name: "personal",
        niceName: "Personalized",
        description: "Personalized feed based on your interactions",
    }];

    if (full) return possible;
    const allowed = [];
    
    for (const pref of possible) {
        if (!pref.speical) allowed.push(pref.name);
    }

    return allowed;
}

function checkIfValidPreference({ pref }) {
    const allowed = getPossiblePreferences();
    if (allowed.includes(pref)) return true;
    else return searchError("Q002");
}

async function getPreference({ userID }) {
    if (!userID) return searchError("B009")
    const foundPref = await interactUserFeedSchema.findOne({ _id: userID });

    if (!foundPref || (!foundPref.isUserSet && foundPref.preferredFeed=="allPosts")) {
        const newPref = await setDefaultPreference({ userID, currentPrefData: foundPref });
        return newPref;
    }

    return foundPref;
}

async function setDefaultPreference({ userID, currentPrefData }) {
    if (!userID) return searchError("B009");

    if (!currentPrefData) {
        const newPref = await interactUserFeedSchema.create({
            _id: userID,
            timestamp: checktime(),
            preferredFeed: defaultPref,
            isUserSet: false
        });
        return newPref;
    } else {
        const updatedPref = await interactUserFeedSchema.findOneAndUpdate({
            _id: userID
        }, {
            timestamp: checktime(),
            preferredFeed: defaultPref,
            isUserSet: false
        }, {
            new: true,
        });

        return updatedPref;
    }
}

async function updateUserPreference({ userID, pref }) {
    if (!userID) return searchError("B009")
    if (!pref) return searchErrorV2("Q001", { userID });
    
    await getPreference({ userID }); // will create default if not exists

    const valid = checkIfValidPreference({pref});
    if (!valid || valid.error) return valid;

    const updatedPref = await interactUserFeedSchema.findOneAndUpdate({
        _id: userID 
    }, {
        timestamp: checktime(),
        preferredFeed: pref,
        isUserSet: true
    }, {
        new: true,
    });

    return updatedPref;
}

/**
 * deletes user feed preference
 */
async function deleteFeedPreference({ userID }) {
    if (!userID) return searchErrorV2("B009", { userID })
    const foundPref = await getPreference({ userID });
    
    await interactUserFeedSchema.findOneAndDelete({ userID });

    return foundPref;
}

module.exports = {
    getFeed,
    getFeedV2,
    getPossiblePreferences,
    getPreference,
    deleteFeedPreference,
    updateUserPreference
}