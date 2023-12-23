const interactIndexSchema = require("../../schemas/indexesSchema/");

const IDname = "production";

/* gets the posts index */
async function getPostIndex() {
    var foundIndex = await interactIndexSchema.findOne({ _id: IDname });
    if (!foundIndex) foundIndex = await createIndexValue();

    if (!foundIndex.postsIndex) return null;
    return foundIndex.postsIndex;
}

/* updates the posts index */
async function updatePostIndex({ indexID }) {
    await getPostIndex(); // makes sure index is created

    await interactIndexSchema.findOneAndUpdate({ 
        _id: IDname
    }, {
        postsIndex: indexID
    });

    return true;
}
/* this will also create the index env*/
async function getThemeIndex() {
    var foundIndex = await interactIndexSchema.findOne({ _id: IDname });
    if (!foundIndex) foundIndex = await createIndexValue();
    
    if (!foundIndex.themeIndex) return null;
    return foundIndex.themeIndex;
}

/* updates the theme index */
async function updateThemeIndex({ indexID }) {
    await getThemeIndex(); // makes sure index is created

    await interactIndexSchema.findOneAndUpdate({ 
        _id: IDname
    }, {
        themeIndex: indexID
    });

    return true;
}

/* creates index for environment */
async function createIndexValue() {
    await interactIndexSchema.create({
        _id: IDname,
        themeIndex: null,
        postsIndex: null,
    });

    return { 
        _id: IDname, 
        themeIndex: null,
        postsIndex: null,
    }
}

module.exports = { 
    getThemeIndex,
    updateThemeIndex,
    getPostIndex,
    updatePostIndex,
};
