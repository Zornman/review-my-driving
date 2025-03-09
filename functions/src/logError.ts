import * as functions from 'firebase-functions/v2';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const logError = functions
.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method Not Allowed' });
      return;
    }
  
    const uri = process.env.MONGO_URI as string;
  
    // Create a client
    const client = new MongoClient(uri);
  
    try {
      const data = JSON.parse(req.body); // Parse incoming data
  
      // Connect to MongoDB
      await client.connect();
  
      // Select the database and collection
      const database = client.db('review_my_driving'); // Replace 'myDatabase' with your database name
      const collection = database.collection('error_log'); // Replace 'myCollection' with your collection name
      console.log(data);
      // Insert the data
      const result = await collection.insertOne(data);
  
      // Close the connection
      await client.close();
  
      res.status(200).json({ message: 'Data inserted successfully!', result });
    } catch (error: any) {
      console.error('Error inserting data:', error);
      res.status(500).json({ message: 'Error inserting data', error: error.message });
    }
  });
});
