/**
 * MongoDB Service (Atlas Data API)
 * Template for interacting with MongoDB Atlas without a direct database driver.
 */

import { BASE_URL } from '../utils/api';
const APP_ID = ""; 
const API_KEY = ""; 
const BASE_URL_CONFIG = `${BASE_URL}/app/${APP_ID}/endpoint/data/v1`;

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Request-Headers': '*',
    'api-key': API_KEY,
};

const mongoRequest = async (action, body) => {
    if (!APP_ID || !API_KEY) {
        console.warn("MongoDB Atlas Data API credentials missing.");
        return null;
    }

    try {
        const response = await fetch(`${BASE_URL_CONFIG}/action/${action}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                dataSource: "Cluster0",
                database: "vyx",
                ...body
            })
        });
        return await response.json();
    } catch (error) {
        console.error(`MongoDB ${action} failed`, error);
        return null;
    }
};

export const request = mongoRequest;

export const findDocuments = (collection, filter = {}) => {
    return mongoRequest('find', { collection, filter });
};

export const insertOne = (collection, document) => {
    return mongoRequest('insertOne', { collection, document });
};

export const updateOne = (collection, filter, update) => {
    return mongoRequest('updateOne', { collection, filter, update });
};

export default {
    request,
    findDocuments,
    insertOne,
    updateOne
};
