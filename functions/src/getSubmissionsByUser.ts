import * as functions from 'firebase-functions/v2';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const getSubmissionsByUser = functions
.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  
  corsHandler(req, res, async () => {
    const uri = process.env['MONGO_URI'] as string;
    const client = new MongoClient(uri);
    const userID = req.query['userID'] as string;

    if (!userID) {
      res.status(400).json({ error: 'Missing userID' });
      return;
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
  
      res.status(200).json({ message: 'Data retrieved successfully!', submissions });
    } catch (error: any) {
      res.status(500).json({ message: 'Error getting data', error: error.message });
    }
  });
});
