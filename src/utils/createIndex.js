const interactPostSchema = require('../database/posts-schema')
const interactUserSchema = require('../database/user-schemas')
const { SCHEMA_VERSIONS } = require('../../config.json')

async function createPostIndex(postID) {    
    await interactPostSchema.findOneAndUpdate({
        _id: postID
    }, {        
        _id: postID,
        __v: SCHEMA_VERSIONS.interactPostSchema
    }, {
        upsert: true
    })
    return postID
}

async function createUserIndex(userID) {    
    await interactUserSchema.findOneAndUpdate({
        _id: userID
    }, {        
        _id: userID,
        __v: SCHEMA_VERSIONS.interactUserSchemas
    }, {
        upsert: true
    })
    
    return userID
}

module.exports = { createPostIndex, createUserIndex}
