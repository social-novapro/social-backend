const interactCategory = require('../../../../schemas/categories/interactCategory');
const { embedSearch, EMBEDING_VERSION } = require('../../../search/embed');
const categories = require('./categories.json');
const { v4: uuidv4 } = require('uuid');
// get all categories, get embeddings for each category

const fs = require('fs');
const { checktime } = require('../../../checktime');
const interactCategoryEmbed = require('../../../../schemas/categories/interactCategoryEmbed');
const { cosineSimilarity } = require('../../../search/searchV2');
// parse categories, then subcategories

var exampleCategoriesVersion = -1;

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

async function assignExamplesFromOllama() {
    for (const category of categories.categories) {
        console.log("CHECKING", category.name);
        // const result = await generateExample({ categoryName: category.name, categoryID: category.id });
        if (result.error) {
            console.error("Error generating example for category", category.name, result);
            continue;
        }
        console.log("Generated example for category", category.name, result.map(function(example) { return `${example.response}`}).join(", "));
        // console.log(myCat);
        for (const subcategory of category.subCategories) {
            console.log("CHECKING", subcategory.name, category.name);
            const result = await generateExample({ categoryName: subcategory.name, categoryID: subcategory.id });
            if (result.error) {
                console.error("Error generating example for category", category.name, result);
                continue;
            }

            console.log("Generated example for category", category.name, result.map(function(example) { return `${example.response}`}).join(", "));
        }
    }
}

async function quickUpdateScriptCategory() {
    // update with new category thing
    const alLCategories = await interactCategoryEmbed.find({});
    for (const category of alLCategories) {
        const categoryUUID = category._id;
        const newUUID = uuidv4();
        console.log("Updating category", category.name, "with new UUID", newUUID, "and old UUID", categoryUUID, "and ID", category.id);
        
        await interactCategoryEmbed.create({
            _id: newUUID,
            categoryUUID: categoryUUID,
            categoryID: category.id,
            content: category.content,
            timestamp: category.timestamp,
            embeddingVersion: category.embeddingVersion,
            embedding: category.embedding,
            categoryExampleVersion: category.categoryExampleVersion,
            categoryExamples: category.categoryExamples,
            categorySentences: category.categorySentences,
        })

        await interactCategoryEmbed.deleteOne({ _id: categoryUUID });
    }
}

async function generateExample({ categoryName, categoryID }) {
    const result = await fetch('http://localhost:5004/v1/categoryExample/'+encodeURIComponent(categoryName), {
        method: 'POST',
    });

    const res = await result.json();
    return res;
}

/* Startup categories */
async function startupCategories() {
    // await quickUpdateScriptCategory()
    // deleteAllCategories();
    // assignExamplesFromOllama();
    // assignIds();
    if (exampleCategoriesVersion == -1) {
        const result = await fetch('http://localhost:5004/v1/categoryExample/version', {
            method: 'GET',
        });

        const res = await result.json();
        exampleCategoriesVersion = res.version;
    }

    for (const category of categories.categories) {
        console.log("CHECKING", category.name);
        const myCat = await saveCategoryToDB({ id: category.id, categoryName: category.name, parentCategoryID: null });
        
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

/* Get all categories embeddings from the database */
async function getCategoriesEmbeddingsFromDB() {
    const foundCategories = await interactCategoryEmbed.find({});
    return foundCategories;
}

/* Save a category or subcategory to the database */
async function saveCategoryToDB({ id, categoryName, parentCategoryID }) {
    // save category to database
    // might not have subcategory if its main category (e.g. "Technology")
    const foundCategory = await interactCategory.findOne({ id: id });
    const foundExamples = await interactCategoryEmbed.find({ categoryID: id });
    var toUpdateExamples = false;

    const foundExample = (foundExamples && foundExamples.length > 0) ? foundExamples[0] : null;
    if (!foundExample) toUpdateExamples = true;

    if (foundCategory) {
        var updatedCategory = false;
        var reason = null;


        // make sure name is correct
        if (foundCategory.name != categoryName) {
            updatedCategory = true;
            reason = `Name is incorrect. Found: ${foundCategory.name}, Expected: ${categoryName}`;
        }

        // make sure version is correct
        if (foundCategory.version != categories.version) {
            updatedCategory = true;
            reason = `Version is incorrect. Found: ${foundCategory.version}, Expected: ${categories.version}`;
        }
        // make sure has examples entry, and not to many
        else if (!foundExamples || foundExamples.length <= 0 || foundExamples.length > 1) {
            updatedCategory = true;
            toUpdateExamples = true;
            reason = `Examples are missing, or to many entries. Found: ${foundExamples ? foundExamples.length : 0}, Expected: 1`;
        }
        else if (foundExample.embeddingVersion != EMBEDING_VERSION) {
            updatedCategory = true;
            toUpdateExamples = true;
            reason = `Embedding version is incorrect. Found: ${foundExample.embeddingVersion}, Expected: ${EMBEDING_VERSION}`;
        }
        // make sure has sentences and examples needed
        else if ((!foundExample.categoryExamples || !foundExample.categorySentences) || (foundExample.categoryExamples <= 0 || foundExample.categorySentences <= 0) || (foundExample.categoryExamples.length < 5)) {
            updatedCategory = true;
            toUpdateExamples = true;
            reason = `Category examples or sentences are missing, or to many entries. Found: ${foundExample.categoryExamples ? foundExample.categoryExamples.length : 0}, Expected: >0`;
        }

        // make sure example version is correct
        else if (!foundExample.categoryExampleVersion || foundExample.categoryExampleVersion != exampleCategoriesVersion) {
            updatedCategory = true;
            toUpdateExamples = true;
            reason = `Category example version is incorrect. Found: ${foundExample.categoryExampleVersion}, Expected: ${exampleCategoriesVersion}`;
            await interactCategoryEmbed.findOneAndUpdate({
                categoryID: id,
                content: categoryName,
            }, {
                categoryExampleVersion: exampleCategoriesVersion,
            })
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
        if (toUpdateExamples) {
            await interactCategoryEmbed.deleteMany({ categoryID: id });
        }
        console.log("--- DELETED", id, reason);
    }

    const embedding = await embedSearch({ content: categoryName });
    console.log("--- EMBEDING", categoryName)

    const newCategory = await interactCategory.create({
        _id: uuidv4(),
        id: id,
        name: categoryName,
        timestamp: checktime(),
        version: categories.version,
        embeddingVersion: EMBEDING_VERSION,
        isSubCategory: parentCategoryID != null ? true : false,
        parentCategoryID: parentCategoryID ? parentCategoryID : null,
    });

    if (!toUpdateExamples) {
        // update the category UUID in the examples
        await interactCategoryEmbed.findOneAndUpdate(
            { _id: foundExample },
            {
                categoryUUID: newCategory._id,
            }
        );
    
        return newCategory;
    }

    console.log("--- Updating Examples for", categoryName, "with ID", id);

    // Category Example Schema
    const generatedExamples = await generateExample({ categoryName: categoryName, categoryID: id });
    if (!generatedExamples || generatedExamples.error || generatedExamples.length <= 0) {
        console.error("Error generating examples for category", categoryName, generatedExamples);
        return newCategory;
    }

    const categoryExamples = [];
    const categorySentences = [];
    // make "categoryExamples" and "categorySentences" array
    for (const example of generatedExamples) {
        const exampleID = uuidv4();
        if (!example || !example.response) return console.error("Error generating example for category", categoryName, example);
        const exampleContent = example.response.toLowerCase();
        const example_embedding = await embedSearch({ content: exampleContent });
        categoryExamples.push({
            _id: exampleID,
            categoryEmbedID: newCategory.id,
            content: exampleContent,
            embeddingVersion: EMBEDING_VERSION,
            embedding: JSON.stringify(example_embedding.embedding.embedding),
        });

        for (const sentence of example_embedding.embedding.sentences) {
            const sentenceID = uuidv4();
            categorySentences.push({
                _id: sentenceID,
                exampleID: exampleID,
                content: sentence.sentence,
                embeddingVersion: EMBEDING_VERSION,
                embedding: JSON.stringify(sentence.embedding),
            });
        }
    }

    // get and embed examples
    await interactCategoryEmbed.create({
        _id: uuidv4(),
        categoryUUID: newCategory._id,
        categoryID: newCategory.id,
        content: newCategory.name,
        timestamp: checktime(),
        embeddingVersion: EMBEDING_VERSION,
        embedding: JSON.stringify(embedding.embedding.embedding),
        categoryExampleVersion: generatedExamples[0].versionNumber,
        categoryExamples: categoryExamples,
        categorySentences: categorySentences,
    });

    return newCategory;
}
async function quickTest() {
    const catRunTime = await getCategoryRuntimeInfo();
    for (const cat of catRunTime.categories) {
        console.log("Category:", cat.name, "ID:", cat.id);
    }

    var i = 0;
    for (const cat of catRunTime.catEmbeddings) {
        i++;

        const foundSimilarityPost = cosineSimilarity(
            cat,
            catRunTime.catEmbeddings,
            catRunTime.catExampleSentences,
        );
        console.log("Found Similarity:", foundSimilarityPost, catRunTime.catNames[i], catRunTime.catExampleSentences[i] + "\n---");
    }

    console.log("Category Embeddings:", catRunTime.catEmbeddings.length);
    console.log("Category Names:", catRunTime.catNames.length);


}
// quickTest();

async function getCategoryRuntimeInfo() {
    const categories = await getCategoriesFromDB();
    const catExamples = await getCategoriesEmbeddingsFromDB();
    const catEmbeddings = [];
    const catExampleSentences = [];
    const catNames = [];

    for (const cat of catExamples.sort((a, b) => a.categoryID - b.categoryID)) {
        // push category examples 
        for (const example of cat.categoryExamples ?? []) {
            if (!example || !example.embedding) continue;
            catEmbeddings.push(JSON.parse(example.embedding ?? "[]"));
            catExampleSentences.push(example.content);
            catNames.push(cat.content);
            console.log(`Pushed category example embedding for ${cat.content}, example: ${example.content}`);
        }
    }
   

    // for (const cat of categories) {
    //     catEmbeddings.push(JSON.parse(cat.embedding ?? "[]"));
    //     catNames.push(cat.name);
    // }

    return {
        categories: categories,
        catEmbeddings: catEmbeddings,
        catNames: catNames,
        catExamples: catExamples,
        catExampleSentences: catExampleSentences,
    }
}

module.exports = { startupCategories, getCategoriesFromDB, getCategoriesEmbeddingsFromDB, getCategoryFromDB, getCategoryRuntimeInfo };