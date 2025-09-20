require('dotenv').config();
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGO_URI);


let db;

async function connectDB() {
    if (db) return db; // Return existing connection if already connected
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        db = client.db("fav"); // Replace with your database name
        return db;
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    }
}

module.exports = { connectDB };
