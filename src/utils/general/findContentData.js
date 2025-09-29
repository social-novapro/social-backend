const { getPostWithData } = require("../post/getPost");
// const { findContentType } = require("./findContentType");

async function findContentData(userID, UUID, contentType) {
    console.log("find content data?", { userID, UUID, contentType });   
    if (!userID) return {error: true, msg: "No userID provided"};
    if (!UUID) return { error: true, msg: "No UUID provided" };
    if (!contentType && contentType != 0) return {error: true,msg: "no content type provided"};// && contentType !== 0 && contentType !== -1) contentType = await findContentType(UUID);
    // if (!contentType) contentType = await findContentType(UUID);
    if (contentType === -1) return { error: true, msg: "contenttype is invalid" };

    if (contentType === 0) {
        const foundPost = await getPostWithData({ userID, postID: UUID });
        if (foundPost && !foundPost.error) return foundPost;
        else return { error: true, msg: "post not found" };
    }
    return { error: true, msg: "content type not supported yet" };
}

module.exports = { findContentData };