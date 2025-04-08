// src/../shared/db/index.js
const { Pool } = require('pg');
// At the top of your db/index.js file
require('dotenv').config();
// Connection is established using environment variables
// These should be set in Azure Function App settings
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

console.log("env variables in db.js", process.env.DB_USER, process.env.DB_HOST, process.env.DB_NAME, String(process.env.DB_PASSWORD), process.env.DB_PORT)

// Test the connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect()
};