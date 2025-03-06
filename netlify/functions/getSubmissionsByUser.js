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
        const database = client.db('review_my_driving'); // Replace 'myDatabase' with your database name
        const collection = database.collection('submissions'); // Replace 'myCollection' with your collection name

        // Get submissions by userID
        const submissions = await collection.find({ user_id: userID }).toArray();

        // Close the connection
        await client.close();

        return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Data retrieved successfully!', submissions }),
        };
    } catch (error) {
        return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error getting data', error: error.message }),
        };
    }
};
