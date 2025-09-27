const interactPostSchema = require("../../schemas/interactPostSchema");
const interactUserSchema = require("../../schemas/interactUserSchema");
const interactLiveChatSchema = require("../../schemas/liveChatSchema");

/*
0 = post - postID
1 = user - userID
2 = notification - notificationID
3 = ai response - responseID
4 = image or media - mediaID
5 = chat message - messageID
*/
async function findContentType(UUID, disallowedTypes=[]) {
    const foundPost = await interactPostSchema.findOne({ _id: UUID });
    if (foundPost) return 0;

    const foundUser = await interactUserSchema.findOne({ _id: UUID });
    if (foundUser) return 1;

    // const foundNotification = await interactNotificationSchema.findOne({ _id: UUID });
    // if (foundNotification) return 2;

    // const foundAIResponse = await interactAIResponseSchema.findOne({ _id: UUID });
    // if (foundAIResponse) return 3;

    // const foundMedia = await /*interactMediaSchema*/.findOne({ _id: UUID });
    // if (foundMedia) return 4;

    const foundChatMessage = await interactLiveChatSchema.findOne({ _id: UUID });
    if (foundChatMessage) return 5;

    return -1;
}

module.exports = { findContentType };