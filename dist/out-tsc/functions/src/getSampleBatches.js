import * as functions from 'firebase-functions/v2';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const getSampleBatches = functions
.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  
  corsHandler(req, res, async () => {
    const uri = process.env['MONGO_URI'];
    const client = new MongoClient(uri);
  
    try {
      // Connect to MongoDB
      await client.connect();
  
      // Select the database and collection
      const database = client.db('review_my_driving'); // Replace 'myDatabase' with your database name
      const collection = database.collection('sample_batches'); // Replace 'myCollection' with your collection name
  
      // Get sample batches
      const sample_batch = await collection.find().toArray();
  
      // Close the connection
      await client.close();
  
      res.status(200).json({ message: 'Data retrieved successfully!', sample_batch });
    } catch (error) {
      res.status(500).json({ message: 'Error getting data', error: error.message });
    }
  });
});
