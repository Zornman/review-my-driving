import * as functions from 'firebase-functions/v2';
import { MongoClient } from 'mongodb';

export const getUserOrderHistory = functions
.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  const uri = process.env.MONGO_URI as string;
  const userID = req.query.userID as string;

  const client = new MongoClient(uri);

  if (!userID) {
    res.status(400).json({ error: 'Missing userID' });
    return;
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

    res.status(200).json({ message: 'Data retrieved successfully!', orderHistory });
  } catch (error: any) {
    res.status(500).json({ message: 'Error getting data', error: error.message });
  }
});
