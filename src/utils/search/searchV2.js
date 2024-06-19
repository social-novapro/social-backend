const interactEmbedPostSchema = require('../../schemas/embeddings/interactEmbedPost');
const interactEmbedSentenceSchema = require('../../schemas/embeddings/interactEmbedSentence');
const interactEmbedSentencePostSchema = require('../../schemas/embeddings/interactEmbedSentencePost');
const interactPostSchema = require('../../schemas/interactPostSchema');
const interactUserSchema = require('../../schemas/interactUserSchema');
const { checktime } = require('../checktime');
const { getPostWithData } = require('../post/getPost');
const { getPrivacySetting } = require('../privacy');
const { getUserRelation } = require('../user/relations');
const { embedSearch } = require('./embed');
const { searchPostTags } = require('./searchPostTags');
const { lookupUsers } = require('./searchUserTag');

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

    for (const postID of postIDs) {
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

    var tagsFound = await searchPostTags(userID, lookupkeysArr);

    var found = {
        usersFound,
        postsFound: PostData,
        tagsFound,
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

    const similarSentences = cosineSimilarity(searchEmbedding.embedding.sentences[0].embedding, similarArrSentence, sentenceContents);
    // console.log(similarities)
    
    const topSentences = similarSentences.slice(0, 50);
    const topPostIDs = topSentences.map((rank) => {
        if (rank.similarity > 0.9) return allSentences[rank.index].postID
    });

    return topPostIDs.reverse();
}

function cosineSimilarity(inputSearch, similarEmbeddings, contents) {
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
        return {similarity, index, content: contents[index]};
    });

    // Sort by similarity in descending order
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities;
}

module.exports = { searchV2 };