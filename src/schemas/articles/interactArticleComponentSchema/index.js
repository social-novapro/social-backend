const mongoose = require('mongoose');
const { reqNum, reqString, reqBool, nonreqNum, nonreqString } = require('../../types');

const interactArticleComponentSchema = mongoose.Schema({
    _id: reqString, // articleComponentID
    articleID: reqString, // articleID its apart of
    order: reqNum, // order in article
    timestamp: reqNum, // time created 
    timestampEdited: nonreqNum, // time edited
    componentID: reqNum, 
    // options
    font_size: nonreqNum,
    alignment: nonreqString, // center, left, right
    source: nonreqString, // for quotes and images mainly
    padding_bottom: nonreqNum,
    indent: nonreqNum,
});

module.exports = mongoose.model('interact-article-component', interactArticleComponentSchema);