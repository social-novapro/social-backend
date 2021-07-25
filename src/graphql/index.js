const { 
    GraphQLObjectType, GraphQLString, GraphQLList, GraphQLInt, GraphQLSchema, GraphQLBoolean,
} = require('graphql')
const { checktime } = require('../utils/checktime')
const { newUserID, newPostID } = require('../utils/index.js')
const interactMainSchema = require('../database/interact-schema')
const interactUserSchema = require('../database/user-schemas');
const interactPostSchema = require('../database/posts-schema')
const interactHomeSchema = require('../database/home-schema')

const UserDataType = new GraphQLObjectType({
    name: 'UserDataType',
    fields: () => ({
       _id: { type: GraphQLString},
       username: { type: GraphQLString},
       password: { type: GraphQLString},
       posts: { type: GraphQLString},
       likes: { type: GraphQLString}
    })
})

const SingleNotificationType = new GraphQLObjectType({
    name: 'SingleNotificationType',
    fields: () => ({
        _id: { type: GraphQLString },
        action: { type: GraphQLString },
        postID: { type: GraphQLString }
    })
})
const ReplyingDataType = new GraphQLObjectType({
    name: 'ReplyingDataType',
    fields: () => ({
       _id: { type: GraphQLString },
       replying: { type: GraphQLBoolean }
    })
})

const PostDataType = new GraphQLObjectType({
    name: 'PostDataType',
    fields: () => ({
       _id: { type: GraphQLString},
       replyingSchema: { type: ReplyingDataType},
       authorID: { type: GraphQLString},
       timePosted: { type: GraphQLString },
       content: { type: GraphQLString}
    })
})

const RootQuery= new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
        getUserData: {
            type: UserDataType,
            args: {
                userID: { type: GraphQLString },
            },
            async resolve(parent, args, request) {
                const { guildId } = args;
                if (!guildId || !request.user) return null;
                const data = await welcomeSchema.findOne({ _id: guildId })
                return data ? data : null
            }
        },
    }
})

const MutationQuery = new GraphQLObjectType({
    name: 'RootMutationQuery',
    fields: {
        updateUserName: {
            type: UserDataType,
            args: {
                userID: { type: GraphQLString },
                username: { type: GraphQLString}
            },
            async resolve(parent, args, request) {
                const { userID , username} = args;
                if (!userID || !username) return null;
                const data = await interactUserSchema.findOneAndUpdate({ _id: userID }, { username }, {new: true})
                return data ? data : null
            }
        },
        updateUserPassword: {
            type: UserDataType,
            args: {
                userID: { type: GraphQLString },
                password: { type: GraphQLString}
            },
            async resolve(parent, args, request) {
                const { userID } = args;
                if (!userID) return null;
                const data = await interactUserSchema.findOneAndUpdate({ _id: userID }, { password }, {new: true})
                return data ? data : null
            }
        },
        createPost: {
            type: PostDataType,
            args: {
                userID: { type: GraphQLString },
                replying: { type: GraphQLBoolean },
                replyingTo: { type: GraphQLString},
                content: { type: GraphQLString },
            },
            async resolve(parent, args, request) {
                const { userID, replying, replyingTo, content} = args;
                // if (!userID) return null;
                const postID = await newPostID()
                const replyingData = {
                    _id: replyingTo,
                    replying,
                }

                const post = await interactPostSchema.findOneAndUpdate(
                    {  _id: postID },
                    { 
                        _id: postID,
                        replying: replyingData,
                        authorID: userID,
                        timePosted: checktime(),
                        content 
                    }, 
                    { new: true }
                )

                await interactUserSchema.findOneAndUpdate(
                    { _id: userID} ,
                    { $push : { posts: postID} }
                )
                console.log(post)
                // const data = await interactUserSchema.findOneAndUpdate({ _id: userID }, { posts }, {new: true})
                return post ? post : null
            }
        },
        updateUserPosts: {
            type: UserDataType,
            args: {
                userID: { type: GraphQLString },
                password: { type: GraphQLString}
            },
            async resolve(parent, args, request) {
                const { userID } = args;
                if (!userID) return null;
                /*
                const userDataPush = {
                    _id: message.author.id,
                    joinedTimeStamp: message.createdTimestamp
                }
            
                await gameSchema.findOneAndUpdate(
                    { _id: gameID }, 
                    { $push : { posts: userDataPush } }
                )

                const data = await interactUserSchema.findOneAndUpdate(
                    { _id: userID }, 
                    { posts }, 
                    {new: true}
                )
                */
                return userData ? userData : null
            }
        }
    }
})

module.exports = new GraphQLSchema({ query: RootQuery, mutation: MutationQuery })