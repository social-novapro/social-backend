const interactCategory = require('../../../../schemas/categories/interactCategory');
const { embedSearch } = require('../../../search/embed');
const { categories } = require('./categories.json');
const { v4: uuidv4 } = require('uuid');
// get all categories, get embeddings for each category


// parse categories, then subcategories
async function startupCategories() {
    // deleteAllCategories();
    for (const category of categories) {
        // console.log(category.name);
        const myCat = await saveCategoryToDB({ categoryName: category.name, parentCategory: null });

        // console.log(myCat);
        for (const subcategory of category.subCategories) {
            console.log(subcategory.name, category.name);
            const mySubCat = await saveCategoryToDB({ categoryName: subcategory.name, parentCategory: myCat.name });
            
            // console.log(mySubCat);
        }
    }
}


async function deleteAllCategories() {
    await interactCategory.deleteMany({});
}

async function getCategoryFromDB({ categoryName }) {
    const foundCategories = await interactCategory.findOne({name: categoryName});
    return foundCategories;
}

async function getCategoriesFromDB() {
    const foundCategories = await interactCategory.find({});
    return foundCategories;
}
async function saveCategoryToDB({ categoryName, parentCategory }) {
    // save category to database
    // might not have subcategory if its main category (e.g. "Technology")

    const foundCategory = await interactCategory.findOne({ name: categoryName });
    if (foundCategory) {
        if (
            (parentCategory != null) && 
            (parentCategory != foundCategory.parentCategory || foundCategory.isSubCategory == false)
        ) {
            await interactCategory.deleteOne({ name: categoryName });
        } else {
            return foundCategory
        }
    }

    const embedding = await embedSearch({ content: categoryName });
    console.log("EMBEDING", categoryName)

// console.log(embedding.embedding.embedding)
    const newCategory = await interactCategory.create({
        _id: uuidv4(),
        name: categoryName,
        timestamp: Date.now(),
        isSubCategory: parentCategory != null ? true : false,
        parentCategory: parentCategory ? parentCategory : null,
        embedding: JSON.stringify(embedding.embedding.embedding),
    });

    return newCategory;
}

module.exports = { startupCategories, getCategoriesFromDB, getCategoryFromDB };