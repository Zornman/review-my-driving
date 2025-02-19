const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
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

    // Ensure required fields exist
    if (!data.userID || !data.firstName || !data.lastName || !data.email || !data.phone || !data.address1 || !data.city || !data.zip) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required user shipping fields' }),
      };
    }

    // Connect to MongoDB
    await client.connect();
    const database = client.db('review_my_driving');
    const collection = database.collection('user_shipping_info');

    // Update or insert (upsert) user shipping info
    const result = await collection.updateOne(
      { userID: data.userID }, // Find by userID
      {
        $set: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          country: data.country || 'US', // Default to 'US' if not provided
          region: data.region,
          address1: data.address1,
          address2: data.address2 || '', // Default to empty if not provided
          city: data.city,
          zip: data.zip,
          updatedAt: new Date() // Timestamp for last update
        }
      },
      { upsert: true } // Create new entry if user doesn't exist
    );

    // Close the connection
    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: result.matchedCount > 0 ? 'Shipping info updated successfully!' : 'Shipping info added successfully!',
        result
      }),
    };
  } catch (error) {
    console.error('Error updating/inserting data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error updating/inserting data', error: error.message }),
    };
  }
};
