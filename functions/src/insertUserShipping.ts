import * as functions from 'firebase-functions/v2';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const insertUserShipping = functions
.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method Not Allowed' });
      return;
    }
    const uri = process.env['MONGO_URI'] as string;
    const client = new MongoClient(uri);
  
    try {
      const data = JSON.parse(req.body); // Parse incoming data
  
      // Ensure required fields exist
      if (!data.userID || !data.firstName || !data.lastName || !data.email || !data.phone || !data.address1 || !data.city || !data.zip) {
        res.status(400).json({ message: 'Missing required user shipping fields' });
        return;
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
  
      res.status(200).json({
        message: result.matchedCount > 0 ? 'Shipping info updated successfully!' : 'Shipping info added successfully!',
        result
      });
    } catch (error: any) {
      console.error('Error updating/inserting data:', error);
      res.status(500).json({ message: 'Error updating/inserting data', error: error.message });
    }
  });
});
