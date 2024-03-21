const { v4: uuidv4 } = require('uuid');
const { checktime } = require('../checktime');
const interactMovieSaveSchema = require('../../schemas/movies/interactMovieSaveSchema');

require('dotenv').config({ path: 'secret.env' });

// SAVES
/* get a single saved movie */
async function getSaved({ userID, saveID }) {}

/* Removes saved film from list */
async function removeSaved({ userID, saveID }) {}

/* Gets list/user profile */
async function getSavedList({ userID, listID, indexID }) { }

async function saveData({ userID, listID, traktID, imdbID }) { 
    const foundSave = await getSaved({ userID, traktID });
    if (foundSave) return foundSave;

    const save = await interactMovieSaveSchema.create({
        _id: uuidv4(),
        userID,
        //listID,
        traktID,
        imdbID,
        timestamp: checktime(),
        watchCount: 0
    });

    return save;
}

// FILMS
/* Get data about a film */
async function getFilm({ movieID }) { 
    /* gets */
    const foundFilmRes = await fetch(`https://api.trakt.tv/movies/${movieID}?extended=full`, {
        headers: {
            'Content-Type': 'application/json',
            'trakt-api-key': process.env.TRAKT_API_KEY,
            'trakt-api-version': '2'
        }
    })

    if (!foundFilmRes.ok) return null;
    const foundFilm = await foundFilmRes.json();

    const reformatFilm = {
        title: foundFilm.title,
        year: foundFilm.year,
        traktId: foundFilm.ids.trakt,
        imdbId: foundFilm.ids.imdb,
        tagline: foundFilm.tagline,
        overview: foundFilm.overview,
        runtime: foundFilm.runtime,
        country: foundFilm.country,
        // updated_at: foundFilm.updated_at,
        status: foundFilm.status,
        trailer: foundFilm.trailer,
        genres: foundFilm.genres,
        certification: foundFilm.certification,
        film: {
            released: foundFilm.released,
        },
    }

    return reformatFilm;
}

/* Save film to a list or to the user's profile */
async function saveFilm({ movieID, listID }) { }

// SHOWS
async function getShow({ showID }) {
    const foundShowRes = await fetch(`https://api.trakt.tv/shows/${showID}?extended=full`, {
        headers: {
            'Content-Type': 'application/json',
            'trakt-api-key': process.env.TRAKT_API_KEY,
            'trakt-api-version': '2'
        }
    })

    if (!foundShowRes.ok) return null;
    const foundShow = await foundShowRes.json();

    const reformatShow = {
        title: foundShow.title,
        year: foundShow.year,
        traktId: foundShow.ids.trakt,
        imdbId: foundShow.ids.imdb,
        tagline: foundShow.tagline,
        overview: foundShow.overview,
        released: foundShow.released,
        runtime: foundShow.runtime,
        country: foundShow.country,
        // updated_at: foundShow.updated_at,
        status: foundShow.status,
        trailer: foundShow.trailer,
        genres: foundShow.genres,
        certification: foundShow.certification,
        show: {
            first_aired: foundShow.first_aired,
            network: foundShow.network,
            aired_episodes: foundShow.aired_episodes
        }
    }
    
    return reformatShow;
}

async function saveShow({ showID, listID }) { }

// EPISODE
async function saveEpisode({ episodeID, listID }) { }
async function getEpisode({ episodeID }) { }

// PEOPLE
async function savePerson({ personID, listID }) { }
async function getPerson({ personID }) { }

// SEARCH
async function search({ query }) { }

/*
    movie
        https://trakt.docs.apiary.io/#reference/movies/summary/get-a-movie

        https://trakt.docs.apiary.io/#reference/movies/people/get-all-people-for-a-movie
        https://trakt.docs.apiary.io/#reference/movies/related/get-related-movies
        https://trakt.docs.apiary.io/#reference/movies/studios/get-movie-studios
    show
        https://trakt.docs.apiary.io/#reference/shows/summary/get-a-single-show
        https://trakt.docs.apiary.io/#reference/shows/people/get-all-people-for-a-show
        https://trakt.docs.apiary.io/#reference/shows/stats/get-show-studios
        https://trakt.docs.apiary.io/#reference/shows/next-episode/get-next-episode
        https://trakt.docs.apiary.io/#reference/shows/last-episode/get-last-episode
    episode
        https://trakt.docs.apiary.io/#reference/episodes/summary/get-a-single-episode-for-a-show
    people
        https://trakt.docs.apiary.io/#reference/people/summary/get-a-single-person

    box office
        GET https://api.trakt.tv/movies/boxoffice
        https://trakt.docs.apiary.io/#reference/movies/box-office/get-the-weekend-box-office
    


    search 
        https://trakt.docs.apiary.io/#reference/search/text-query/get-text-query-results
        https://trakt.docs.apiary.io/#reference/search/id-lookup/get-id-lookup-results
*/


module.exports = {
    saveFilm,
    getFilm
}