const { MongoClient } = require('mongodb');
require('dotenv').config();

// Replace with your MongoDB connection string
const uri = process.env.MONGO_URI;

// Create a client
const client = new MongoClient(uri);

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const userId = event.queryStringParameters.userId;

    if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Missing userId parameter' }),
        };
    }

    // Connect to MongoDB
    await client.connect();

    // Select the database and collection
    const database = client.db('review_my_driving'); // Replace 'myDatabase' with your database name
    const collection = database.collection('user_shipping_info'); // Replace 'myCollection' with your collection name

    // Insert the data
    const result = await collection.findOne({ userID: userId });

    // Close the connection
    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data retrieved successfully!', result }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error inserting data', error: error.message }),
    };
  }
};