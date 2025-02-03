const { v4: uuidv4 } = require('uuid');
const interactEmbedPostSchema = require('../../../schemas/embeddings/interactEmbedPost');
const interactEmbedSentenceSchema = require('../../../schemas/embeddings/interactEmbedSentence');
const interactEmbedSentencePostSchema = require('../../../schemas/embeddings/interactEmbedSentencePost');
const interactEmbedPostFailSchema = require('../../../schemas/embeddings/interactEmbedPostFail');
const { checktime } = require('../../checktime');
const { current } = require('../../../../config.json')
const productionMode = current == "prod" ? true : false;
const {
    EMBED_API_DEV_ROUTE,
    EMBED_API_PROD_ROUTE,
} = process.env;

const EMBED_API_ROUTE = productionMode == true ? EMBED_API_PROD_ROUTE : EMBED_API_DEV_ROUTE;
console.log(`---\nEmbedding API: ${EMBED_API_ROUTE}`)

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
    const sentencePosts = await interactEmbedSentencePostSchema.deleteMany({ postID });

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
                postID,
                sentenceID: sentenceFound._id,
            });
        } else {
            const sentenceID = uuidv4();
            await interactEmbedSentenceSchema.create({
                _id: sentenceID,
                sentence: sentence.sentence,
                embedding: JSON.stringify(sentence.embedding),
            });
    
            await interactEmbedSentencePostSchema.create({
                _id: uuidv4(),
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
            reason: "Missing data",
        });
        return { success: false, error: "Missing data" };
    }
    const contentLc = content.toLowerCase();
    const embeddings = await embedContent({ content: contentLc });
    if (!embeddings.success){
        // save that post failed to embed, with reason
        await interactEmbedPostFailSchema.create({
            _id: uuidv4(),
            postID: postID ?? "Unknown",
            timestamp: checktime(),
            fixed: false,
            reason: embeddings.error ?? "unknown error",
        });
    };

    await savePostEmbeddings({ postID, userID, timestamp, content: contentLc, embeddings: embeddings })

    return { success: true, postID: postID };
}

async function embedEditedPost({ postID, userID, timestamp, content }) {
    await removePostEmbeddings({ postID });

    await embedPost({ postID, userID, timestamp, content });

    return { success: true };
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
    embedSearch
}