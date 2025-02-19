const { MongoClient } = require('mongodb');
require('dotenv').config();

// Replace with your MongoDB connection string
const uri = process.env.MONGO_URI;

// Create a client
const client = new MongoClient(uri);

exports.handler = async (event) => {
    const userID = event.queryStringParameters?.userID;

    if (!userID) {
        return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userID' }),
        };
    }

    try {
        // Connect to MongoDB
        await client.connect();

        // Select the database and collection
        const database = client.db('review_my_driving');
        const collection = database.collection('user_order_history');

        // Get submissions by userID
        const orderHistory = await collection.find({ userID }).toArray();

        // Close the connection
        await client.close();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data retrieved successfully!', orderHistory }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error getting data in js', error: error.message }),
        };
    }
};
