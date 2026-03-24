const { Pool } = require('pg');
require('dotenv').config();

// The pool uses the DATABASE_URL we will set up in Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render's managed databases
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};

