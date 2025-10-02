import * as functions from 'firebase-functions/v2';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const getBusinessUserInfo = functions
.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET') {
      res.status(405).json({ message: 'Method Not Allowed' });
      return;
    }
    const uri = process.env['MONGO_URI'];
  
    // Create a client
    const client = new MongoClient(uri);
  
    try {
      const userId = req.query['userId'];
  
      if (!userId) {
        res.status(400).json({ message: 'Missing userId parameter' });
        return;
      }
  
      // Connect to MongoDB
      await client.connect();
  
      // Select the database and collection
      const database = client.db('review_my_driving'); // Replace 'myDatabase' with your database name
      const collection = database.collection('business_users'); // Replace 'myCollection' with your collection name
  
      // Insert the data
      const result = await collection.findOne({ userId: userId });
  
      // Close the connection
      await client.close();
  
      res.status(200).json({ message: 'Data retrieved successfully!', result });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving data', error: error.message });
    }
  });
});
