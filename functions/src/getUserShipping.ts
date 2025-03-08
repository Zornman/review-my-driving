import * as functions from 'firebase-functions/v2';
import { MongoClient } from 'mongodb';

export const getUserShipping = functions
.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  const uri = process.env.MONGO_URI as string;

  // Create a client
  const client = new MongoClient(uri);

  try {
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({ message: 'Missing userId parameter' });
      return;
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

    res.status(200).json({ message: 'Data retrieved successfully!', result });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving data', error: error.message });
  }
});
