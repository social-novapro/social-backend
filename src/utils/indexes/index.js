const interactIndexSchema = require("../../schemas/indexesSchema/");

const IDname = "production";

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
        themeIndex: null
    });

    return { 
        _id: IDname, 
        themeIndex: null 
    }
}

module.exports = { 
    getThemeIndex,
    updateThemeIndex
};
