const { MongoClient } = require('mongodb');
require('dotenv').config();

// Replace with your MongoDB connection string
const uri = process.env.MONGO_URI;

// Create a client
const client = new MongoClient(uri);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body); // Parse incoming data

    // Connect to MongoDB
    await client.connect();

    // Select the database and collection
    const database = client.db('review_my_driving'); // Replace 'myDatabase' with your database name
    const collection = database.collection('user_settings'); // Replace 'myCollection' with your collection name

    const filter = { userID: data.userID };
    const update = { 
      $set: { 
        userID: data.userID, 
        messageStyle: data.messageStyle,
        messageBody: data.messageBody
      } 
    };
    const options = { upsert: true };

    // Insert the data
    const result = await collection.updateOne(filter, update, options);

    // Close the connection
    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data inserted successfully!', result }),
    };
  } catch (error) {
    console.error('Error inserting data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error inserting data', error: error.message }),
    };
  }
};
