const { v4: uuidv4 } = require('uuid');
const interactEmbedPostSchema = require('../../../schemas/embeddings/interactEmbedPost');
const interactEmbedSentenceSchema = require('../../../schemas/embeddings/interactEmbedSentence');
const interactEmbedSentencePostSchema = require('../../../schemas/embeddings/interactEmbedSentencePost');
const interactEmbedPostFailSchema = require('../../../schemas/embeddings/interactEmbedPostFail');
const { checktime } = require('../../checktime');
const { current } = require('../../../../config.json');
const productionMode = current == "prod" ? true : false;
const {
    EMBED_API_DEV_ROUTE,
    EMBED_API_PROD_ROUTE,
} = process.env;

const EMBED_API_ROUTE = productionMode == true ? EMBED_API_PROD_ROUTE : EMBED_API_DEV_ROUTE;
console.log(`---\nEmbedding API: ${EMBED_API_ROUTE}`)
const EMBEDING_VERSION = 3;

async function embedContent({ content }) {
    const result = await fetch(EMBED_API_ROUTE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
    })

    const res = await result.json();
    return res;
}

async function removePostEmbeddings({ postID }) {
    const embeddingPost = await interactEmbedPostSchema.findByIdAndDelete(postID);
    const sentencePosts = await interactEmbedSentencePostSchema.find({ postID });

   /*
    // delete sentences that are not used by any other post
    for (const sentencePost of sentencePosts) {
        const moreFound = await interactEmbedSentencePostSchema.find({ sentenceID: sentencePost.sentenceID });
        var deleteZombie = true;
        if (moreFound) {
            for (const found of moreFound) {
                if (found.postID == postID) continue; // skip the current post
                
                console.log(`Found sentence ${sentencePost.sentenceID} used by post ${found.postID}`);

                const foundPost = await interactPostSchema.findOne({ _id: found.postID });
                if (foundPost) {
                    console.log(`Found post ${found.postID} with content: ${foundPost.content}`);
                    // this sentence is still used by another post
                    deleteZombie = false; 
                } else {
                    console.log(`Post ${found.postID} not found`);
                }
            }
            console.log(`Not deleting sentence ${sentencePost.sentenceID}, still used by ${moreFound.length} posts`);
        }

        if (!moreFound || deleteZombie) {
            console.log("Deleting sentence", sentencePost.sentenceID);
            await interactEmbedSentenceSchema.findByIdAndDelete(sentencePost.sentenceID);
        }
    }
   
   */
    await interactEmbedSentencePostSchema.deleteMany({ postID });

    return {
        embeddingPost,
        sentencePosts,
    };
}

async function getPostEmbedding({ postID }) {
    const embeddingPost = await interactEmbedPostSchema.findOne({_id: postID});
    const sentencePosts = await interactEmbedSentencePostSchema.find({ postID });

    const sentences = [ ];
    for (const sentencePost of sentencePosts) {
        const sentence = await interactEmbedSentenceSchema.findOne({ _id: sentencePost.sentenceID});
        sentences.push(sentence);
    }

    return {
        embeddingPost,
        sentences,
    };
}

async function savePostEmbeddings({ postID, userID, timestamp, content, embeddings}) {
    await interactEmbedPostSchema.create({
        _id: postID,
        version: EMBEDING_VERSION,
        userID,
        timestamp,
        content,
        embedding: JSON.stringify(embeddings.embedding.embedding),
    });

    for (const sentence of embeddings.embedding.sentences) {
        const sentenceFound = await interactEmbedSentenceSchema.findOne({ sentence: sentence.sentence });
        if (sentenceFound) {
            await interactEmbedSentencePostSchema.create({
                _id: uuidv4(),
                version: EMBEDING_VERSION,
                postID,
                sentenceID: sentenceFound._id,
            });
            // check if sentenceFound embedding_version matches
            if (sentenceFound.version != EMBEDING_VERSION) {
                console.warn(`Warning--Updating: Sentence ${sentence.sentence} has outdated embedding version ${sentenceFound.version}, expected ${EMBEDING_VERSION}`);
                await interactEmbedSentenceSchema.findOneAndUpdate(
                    { _id: sentenceFound._id },
                    { $set: { 
                        version: EMBEDING_VERSION,
                        timestamp: checktime(),
                        embedding: JSON.stringify(sentence.embedding)
                    } }
                );
            }
        } else {
            const sentenceID = uuidv4();
            await interactEmbedSentenceSchema.create({
                _id: sentenceID,
                version: EMBEDING_VERSION,
                sentence: sentence.sentence,
                embedding: JSON.stringify(sentence.embedding),
            });
    
            await interactEmbedSentencePostSchema.create({
                _id: uuidv4(),
                version: EMBEDING_VERSION,
                postID,
                sentenceID: sentenceID,
            });
        }
    }
}
async function embedPost({ postID, userID, timestamp, content }) {
    console.log("REMOVE -- embeding post")
    if (!postID || !userID || !timestamp || !content) {
        await interactEmbedPostFailSchema.create({
            _id: uuidv4(),
            postID: postID ?? "Unknown",
            timestamp: checktime(),
            fixed: false,
            version: EMBEDING_VERSION,
            reason: "Missing data, " + JSON.stringify({ postID, userID, timestamp, content }),
        });
        return { success: false, error: "Missing data" };
    }
    // const contentLc = content.toLowerCase();
    // const embeddings = await embedContent({ content: contentLc });
    const embeddings = await embedSearch({ content });
    if (!embeddings.success){
        // save that post failed to embed, with reason
        await interactEmbedPostFailSchema.create({
            _id: uuidv4(),
            postID: postID ?? "Unknown",
            timestamp: checktime(),
            fixed: false,
            version: EMBEDING_VERSION,
            reason: embeddings.error ?? "unknown error",
        });
    };

    await savePostEmbeddings({ postID, userID, timestamp, content: content.toLowerCase(), embeddings: embeddings })

    return { success: true, postID: postID };
}

async function embedEditedPost({ postID, userID, timestamp, content }) {
    await removePostEmbeddings({ postID });

    await embedPost({ postID, userID, timestamp, content });

    return { success: true };
}

async function findPostEmbedZombies() {
    const allPostsEmbedding = await interactEmbedPostSchema.find();
    const allSentencePostsEmbedding = await interactEmbedSentencePostSchema.find();
    const allSentencesEmbedding = await interactEmbedSentenceSchema.find();

    console.log(`Found ${allPostsEmbedding.length} post embeddings, ${allSentencePostsEmbedding.length} sentence posts, and ${allSentencesEmbedding.length} sentences.`);

    for (const postEmbed of allPostsEmbedding) {
        await interactEmbedPostSchema.findOneAndDelete({ _id: postEmbed._id });
    }
    for (const sentencePostEmbed of allSentencePostsEmbedding) {
        await interactEmbedSentencePostSchema.findOneAndDelete({ _id: sentencePostEmbed._id });
    }
    for (const sentenceEmbed of allSentencesEmbedding) {
        await interactEmbedSentenceSchema.findOneAndDelete({ _id: sentenceEmbed._id });
    }
    console.log("Deleted all post embeddings, sentence posts, and sentences.");

    return {
        allPostsEmbedding,
        allSentencePostsEmbedding,
        allSentencesEmbedding,
    }
}

async function deleteEmbedPost({ postID }) {
    const embeddings = await removePostEmbeddings({ postID });
    return { success: true, embeddings };
}

async function embedSearch({ content }) {
    const contentLc = content.toLowerCase();
    const embeddings = await embedContent({ content: contentLc });

    if (!embeddings.success){
        // save that post failed to embed, with reason
    };

    return embeddings;
}

module.exports = {
    embedPost,
    getPostEmbedding, 
    embedEditedPost,
    deleteEmbedPost,
    embedSearch,
    findPostEmbedZombies,
    EMBEDING_VERSION
}