const interactCategory = require('../../../../schemas/categories/interactCategory');
const { embedSearch } = require('../../../search/embed');
const categories = require('./categories.json');
const { v4: uuidv4 } = require('uuid');
// get all categories, get embeddings for each category

const fs = require('fs');
// parse categories, then subcategories

/* Assign ids to categories and subcategories */
function assignIds() {
    var currentId = 0;
    var currentparentId = 0;
    var tempCategories = categories;
    for (const category of tempCategories.categories) {
        currentId=0;
        currentparentId++;

        if (!category.id) {
            category.id = currentparentId*100;
        }

        for (const subcategory of category.subCategories) {
            currentId++;
            if (!subcategory.id) {
                subcategory.id = (currentparentId*100)+currentId;
            }
            console.log(subcategory.name, category.name);
        }
    }

    fs.writeFileSync('src/utils/post/categories/startup/categories.json', JSON.stringify(categories, null, 2));
}

/* Startup categories */
async function startupCategories() {
    // deleteAllCategories();
    // assignIds();
    for (const category of categories.categories) {
        console.log("CHECKING", category.name);
        const myCat = await saveCategoryToDB({ id: category.id, categoryName: category.name, parentCategoryID: null });
        
        // console.log(myCat);
        for (const subcategory of category.subCategories) {
            console.log("CHECKING", subcategory.name, category.name);
            await saveCategoryToDB({ id: subcategory.id, categoryName: subcategory.name, parentCategoryID: myCat.id });
        }
    }
}

/* Delete all categories from the database */
async function deleteAllCategories() {
    await interactCategory.deleteMany({});
}

/* Get a category from the database */
async function getCategoryFromDB({ categoryName, categoryID }) {
    const lookup = categoryName ? { name: categoryName } : { id: categoryID };
    const foundCategories = await interactCategory.findOne(lookup);
    return foundCategories;
}

/* Get all categories from the database */
async function getCategoriesFromDB() {
    const foundCategories = await interactCategory.find({});
    return foundCategories;
}

/* Save a category or subcategory to the database */
async function saveCategoryToDB({ id, categoryName, parentCategoryID }) {
    // save category to database
    // might not have subcategory if its main category (e.g. "Technology")
    const foundCategory = await interactCategory.findOne({ id: id });
    if (foundCategory) {
        var updatedCategory = false;
        var reason = null;

        // make sure name is correct
        if (foundCategory.name != categoryName) {
            updatedCategory = true;
            reason = `Name is incorrect. Found: ${foundCategory.name}, Expected: ${categoryName}`;
        }

        // make sure parent ID is correct
        // parentID was not found, but was found in DB
        else if (
            (!parentCategoryID && foundCategory.parentCategoryID) || 
            (parentCategoryID && !foundCategory.parentCategoryID) ||
            (parentCategoryID && !foundCategory.isSubCategory) ||
            (foundCategory.isSubCategory && !parentCategoryID) ||
            (parentCategoryID == null && foundCategory.parentCategoryID != null) // make sure
        ) {
            updatedCategory = true;
            reason = `Parent ID found or not found when expected. Found: ${foundCategory.parentCategoryID}, Expected: ${parentCategoryID}`;
        }
        // make sure parentId is correct
        if (
            (parentCategoryID != null && foundCategory.parentCategoryID != null) &&
            (parentCategoryID != foundCategory.parentCategoryID)
        ) {
            updatedCategory = true;
            reason = `Parent ID is incorrect. Found: ${foundCategory.parentCategoryID}, Expected: ${parentCategoryID}`;
        }


        if (!updatedCategory) return foundCategory;
        await interactCategory.deleteOne({ id: id });
        console.log("--- DELETED", id, reason);
    }

    const embedding = await embedSearch({ content: categoryName });
    console.log("--- EMBEDING", categoryName)

    const newCategory = await interactCategory.create({
        _id: uuidv4(),
        id: id,
        name: categoryName,
        timestamp: Date.now(),
        isSubCategory: parentCategoryID != null ? true : false,
        parentCategoryID: parentCategoryID ? parentCategoryID : null,
        embedding: JSON.stringify(embedding.embedding.embedding),
    });

    return newCategory;
}

module.exports = { startupCategories, getCategoriesFromDB, getCategoryFromDB };