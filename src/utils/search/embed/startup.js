const { embedPost, embedSearch, EMBEDING_VERSION } = require(".");
const interactEmbedPost = require("../../../schemas/embeddings/interactEmbedPost");
const interactEmbedSentence = require("../../../schemas/embeddings/interactEmbedSentence");
const { checktime } = require("../../checktime");

async function startupPostEmbeddings() {
    console.log('---Updating post embeddings...');
    const foundPosts = await interactEmbedPost.find({ version: { $ne: EMBEDING_VERSION } });
    if (foundPosts.length > 0) {
        console.log(`Found ${foundPosts.length} posts with outdated embeddings, updating...`);
        for (const post of foundPosts) {
            const postID = post._id;
            const userID = post.userID;
            const content = post.content;
            // remove the old embedding
            const timestamp = checktime();
            await interactEmbedPost.findOneAndDelete({ _id: postID });
            // handles embedding and saving the post embedding
            const embeddings = await embedPost({ postID, userID, timestamp, content });
            if (embeddings.success === false) {
                console.error(`Error embedding post ${postID}:`, embeddings.msg);
                continue;
            }
        }
    } else {
        console.log('No outdated posts found.');
    }

    console.log('---Checking outdated sentence posts...');
    const foundSentencePosts = await interactEmbedSentence.find({ version: { $ne: EMBEDING_VERSION } });
    if (foundSentencePosts.length > 0) {
        for (const sentencePost of foundSentencePosts) {
            const sentenceID = sentencePost._id;
            const content = sentencePost.sentence.toLowerCase();

            const embedding = await embedSearch({ content });
            if (!embedding.success) {
                console.error(`Error embedding sentence ${sentenceID}:`, embedding.error);
                continue;
            }
            // Save the embedding for the sentence
            await interactEmbedSentence.findOneAndUpdate({
                _id: sentenceID
            }, {
                $set: {
                    version: EMBEDING_VERSION,
                    timestamp: checktime(),
                    embedding: JSON.stringify(embedding.embedding)
                }
            })
        }
    } else {
        console.log('No outdated sentence posts found.');
    }

    console.log('---Post embeddings updated successfully---');
}

module.exports = { startupPostEmbeddings };