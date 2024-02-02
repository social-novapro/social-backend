const interactBadgeSchema = require("../../../schemas/user/interactBadgeSchema");
const badges = require("./badges.json");
const { checktime } = require("../../checktime");
const { searchErrorV2 } = require("../../searchError");
const { v4: uuidv4 } = require('uuid');

/* gets all badges for a user */
async function getUserBadges({userID}) {
    const badges = await interactBadgeSchema.find({ userID });
    return badges.map(badge => formatBadge(badge));
};

/* gets a specific badge for a user */
async function getBadge({ userID, badgeID }) {
    const badge = await interactBadgeSchema.findOne({ userID, badgeID });
    return formatBadge(badge);
};

/* awards a badge to a user */
async function awardBadge({ userID, badgeID }) {
    const validBadge = findBadgeData({badgeID});
    if (!validBadge || validBadge.error) return searchErrorV2("J007", { userID });

    const foundBadge = await interactBadgeSchema.findOne({ userID, badgeID });
    if (foundBadge) {
        if (validBadge.multiple_count == false) return searchErrorV2("J008", { userID });

        await interactBadgeSchema.findOneAndUpdate({ userID, badgeID }, {
            latest_timestamp: checktime(),
            count: foundBadge.count + 1
        });
    } else {
        await interactBadgeSchema.create({
            _id: uuidv4(),
            userID,
            badgeID,
            timestamp: checktime(),
            count: 1
        });
    };

    const finalBadge = await getBadge({ userID, badgeID });
    return finalBadge;
}

/* revokes a badge from a user */
async function revokeBadge({ userID, badgeID }) {
    const badge = await interactBadgeSchema.findOne({ userID, badgeID });
    if (!badge) return searchErrorV2("J006", { userID });

    if (badge.count > 1) {
        await interactBadgeSchema.findOneAndUpdate({ userID, badgeID }, {
            latest_timestamp: checktime(),
            count: badge.count - 1
        });
        
        return {sucess: true};
    }

    await interactBadgeSchema.findOneAndDelete({ userID, badgeID });
    return {sucess: true};
}

/* gets the full badge data from json */
function findBadgeData({badgeID}) {
    return badges.find(badge => badge.badgeID === badgeID);
}

/* formats the badge data from db and mixes with json */
function formatBadge(badge) {
    const fullBadge = findBadgeData({badgeID: badge.badgeID});
    console.log(fullBadge, badge)
    return {
        id: badge.badgeID,
        name: fullBadge.name,
        description: fullBadge.description,
        count: badge.count,
        showCount: fullBadge.showCount,
        achieved: badge.timestamp,
        latest: badge.latest_timestamp ? badge.latest_timestamp : null,
        info: {
            technical_description: fullBadge.technical_description,
            date_achieved: fullBadge.date_achieved,
            version_intoduced: fullBadge.version_intoduced,
            multiple_count: fullBadge.multiple_count,
        }
    }
}

module.exports = {
    getUserBadges,
    getBadge,
    awardBadge,
    revokeBadge
}