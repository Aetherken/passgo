// server.js

// Remove session middleware
// const session = require('express-session');
// app.use(session({ ... }));

const express = require('express');
const cors = require('cors');

const app = express();

// Proper CORS configuration for cross-origin JWT token requests
app.use(cors({
    origin: '*', // Adjust the origin as needed
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'], // Accept Bearer token headers
}));

app.use(express.json());
// other middleware and routes

app.listen(3000, () => {
    console.log('Server running on port 3000');
});