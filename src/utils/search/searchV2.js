const interactEmbedPostSchema = require('../../schemas/embeddings/interactEmbedPost');
const interactEmbedSentenceSchema = require('../../schemas/embeddings/interactEmbedSentence');
const interactEmbedSentencePostSchema = require('../../schemas/embeddings/interactEmbedSentencePost');
const interactPostSchema = require('../../schemas/interactPostSchema');
const interactUserSchema = require('../../schemas/interactUserSchema');
const interactPostTagIndexSchema = require('../../schemas/posts/interactPostTagIndexSchema');
const { checktime } = require('../checktime');
const { getPostWithData } = require('../post/getPost');
const { embedSearch } = require('./embed');
const { searchPostTags, searchHashTags } = require('./searchPostTags');
const { lookupUsers } = require('./searchUserTag');

async function explorePage({ userID }) {
    const returnData = {
        hashtagsFound: [],
        usersFound: [],
        postsFound: [],
    }

    // hashtagsFound -> newest 5 hashtags
    const foundHashtags = await interactPostTagIndexSchema.find({ current: true, tagType: 1 }).sort({timestamp: -1, count: -1 }).limit(5);
    foundHashtags.sort((a, b) => a.timestamp - b.timestamp);
    for (const tag of foundHashtags) {
        returnData.hashtagsFound.push(tag._doc);
    }

    // usersFound -> newest 5 users
    const foundUsers = await interactUserSchema.find().sort({ creationTimestamp: -1 }).limit(5);
    foundUsers.sort((a, b) => a.creationTimestamp - b.creationTimestamp)
    for (const user of foundUsers) {
        // const foundUser
        returnData.usersFound.push(user._doc);
    }

    // postsFound -> newest 5 posts
    const foundPosts = await interactPostSchema.find().sort({ timestamp: -1 }).limit(10);
    foundPosts.sort((a, b) => a.timestamp - b.timestamp);
    for (const post of foundPosts) {
        const fullPost = await getPostWithData({ userID: userID, post });
        if (fullPost && !fullPost.error) {
            returnData.postsFound.push(fullPost);
        }
    }

    return returnData;
}

async function searchV2({ lookUpKey, userID }) {
    const start = checktime();
    if (!lookUpKey) return searchErrorV2("U001", { userID: "unknown" });
    if (!userID) return searchErrorV2("U002", { userID: "unknown" });

    const lookUpKeyLower = lookUpKey.toLowerCase();
    const lookupkeysArr = lookUpKeyLower.split(/[ ]+/) 

    const UserData = await interactUserSchema.find();
    const ownUser = await interactUserSchema.findOne({_id: userID});

    const postIDs = await top50SimilarPosts({ lookUpKey, userID });
    const donePostSimliatie = checktime();
    const PostData = [];
    const postsAdded = {};

    for (const ranking of postIDs) {
        if (!ranking) {"No ranking"; continue}
        const postID = ranking.postID;
        if (postsAdded[postID]) {
            console.log("ALREADY ADDED")
            continue
        };
        const post = await interactPostSchema.findOne({ _id: postID });
        if (post) {
            const fullPost = await getPostWithData({ userID: userID, post, ownUser });
            if (fullPost && !fullPost.error) PostData.push(fullPost);
            postsAdded[postID] = true;
        }
    }

    const donePostAdd = checktime();
   
    const usersFound = await lookupUsers({ userID, lookUpKey, lookUpKeyLower, UserData });
    const tagsFound = await searchPostTags(userID, lookupkeysArr);

    var hashtagsFound = [];
    if (lookUpKey.startsWith("#")) {
        hashtagsFound = await searchHashTags({ userID, text: lookUpKey });
    }
    
    var found = {
        usersFound,
        postsFound: PostData,
        tagsFound,
        hashtagsFound
    };

    const end = checktime();
    console.log(`Search took ${end - start} ms`);
    console.log(`Post Similarity took ${donePostSimliatie - start} ms`);
    console.log(`Post Add took ${donePostAdd - donePostSimliatie} ms`);
    return found;
}

async function top50SimilarPosts({ lookUpKey, userID }) {
    // get the embedding of the search key
    const searchEmbedding = await embedSearch({ content: lookUpKey });
    const finalRanking = [];

    // get all post embeddings
    const allEmbeddings = await interactEmbedPostSchema.find();
    const similarArr = [];
    const contents = [];
    for (const embed of allEmbeddings) {
        const embedding = JSON.parse(embed.embedding);
        similarArr.push(embedding);
        contents.push(embed.content);
    }

    // calculate cosine similarity
    const similarities = cosineSimilarity(searchEmbedding.embedding.embedding, similarArr, contents);
    // console.log(similarities)
    const shortenedRank = similarities.slice(0, 50);
    const postIDs = shortenedRank.map((rank) => allEmbeddings[rank.index]._id);
    for (const rank of shortenedRank) {
        if (rank.similarity > 0.8) {
            finalRanking.push({postID: allEmbeddings[rank.index]._id, similarity: rank.similarity});
        }
    }
    // return postIDs.reversed();

    // ranking top sentences
    const allSentences = [];
    const similarArrSentence = [];
    const sentenceContents = []
    for (const postID of postIDs) {
        const sentences = await interactEmbedSentencePostSchema.find({ postID });
        for (const sentence of sentences) {
            const embedding = await interactEmbedSentenceSchema.findOne({ _id: sentence.sentenceID });
            allSentences.push({
                sentenceID: sentence.sentenceID,
                postID: postID,
            });
            similarArrSentence.push(JSON.parse(embedding.embedding));
            sentenceContents.push(embedding.sentence);
        }
    }

    // why comparing first sentence of the search embedding? 
    /// searchEmbedding.embedding.sentence[0].embedding
    const similarSentences = cosineSimilarity(searchEmbedding.embedding.embedding, similarArrSentence, sentenceContents);
    // console.log(similarities)
    
    const topSentences = similarSentences.slice(0, 50);
    for (const rank of topSentences) {
        if (rank.similarity > 0.8) {
            finalRanking.push({postID: allSentences[rank.index].postID, similarity: rank.similarity});
        }
    }
    return finalRanking.sort((a, b) => a.similarity - b.similarity);
}

function cosineSimilarity(inputSearch, similarEmbeddings, contents, id=null) {
    // Function to calculate dot product of two arrays
    const dotProduct = (arr1, arr2 ) => arr1.reduce((acc, val, i) => acc + val * arr2[i], 0);

    // Function to calculate magnitude of an array
    const magnitude = (arr) => Math.sqrt(arr.reduce((acc, val) => acc + val * val, 0));

    // Calculate the cosine similarity with each similar array
    const similarities = similarEmbeddings.map((arr, index) => {
        const dotProd = dotProduct(inputSearch, arr);
        const inputMagnitude = magnitude(inputSearch);
        const arrMagnitude = magnitude(arr);
        const similarity = dotProd / (inputMagnitude * arrMagnitude);
        return {similarity, index, content: contents[index], id: id ? id[index] : null};
    });

    // Sort by similarity in descending order
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities;
}

module.exports = { searchV2, cosineSimilarity, explorePage };