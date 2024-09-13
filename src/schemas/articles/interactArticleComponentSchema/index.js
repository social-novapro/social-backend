const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqNum, nonreqString } = require('../../types');

const interactArticleComponentSchema = mongoose.Schema({
    _id: reqString, // articleComponentID
    articleID: reqString, // articleID its apart of
    order: reqNum, // order in article
    timestamp: reqNum, // time created 
    timestampEdited: nonreqNum, // time edited
    componentID: reqNum, 
    font_size: reqNum,
    alignment: reqString, // center, left, right
    credit: nonreqString // for quotes and images mainly
});

module.exports = mongoose.model('interact-article-component', interactArticleComponentSchema);