const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqString, nonreqNum } = require('../../types');

const categoryExampleSchema = mongoose.Schema({
    _id: reqString, // uuid
    categoryEmbedID: reqNum, // id of the category this example belongs to
    content: reqString, // full example content
    embeddingVersion: reqNum, // version of the embedding used
    embedding: nonreqString, // embedding of the example
});

const categoryExampleSentenceSchema = mongoose.Schema({
    _id: reqString, // uuid
    exampleID: reqString, // uuid of the example this sentence belongs to
    content: reqString, // sentence content
    embeddingVersion: reqNum, // version of the sentence used
    embedding: nonreqString, // embedding of the sentence
});

const interactCategoryEmbed = mongoose.Schema({
    _id: reqString, // uuid (of interact-category)
    categoryUUID: reqString, // id of the category this embed belongs to
    categoryID: reqNum,
    content: reqString, // category name
    timestamp: reqNum, // timestamp of when the category was embedded
    embeddingVersion: reqNum,
    embedding: nonreqString, // embedding of category name
    categoryExampleVersion: reqNum, // version of the category examples used

    categoryExamples: [categoryExampleSchema], // examples of the category
    categorySentences: [categoryExampleSentenceSchema], // sentences of the category examples
});

module.exports = mongoose.model('interact-category-embed', interactCategoryEmbed);