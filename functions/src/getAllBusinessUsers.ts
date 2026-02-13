import * as functions from 'firebase-functions/v2';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const getAllBusinessUsers = functions
.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'GET') {
            res.status(405).json({ message: 'Method Not Allowed' });
            return;
        }
        const uri = process.env['MONGO_URI'] as string;
    
        // Create a client
        const client = new MongoClient(uri);
    
        try {
            // Connect to MongoDB
            await client.connect();
    
            // Select the database and collection
            const database = client.db('review_my_driving');
            const collection = database.collection('business_users');
    
            // Retrieve all business users
            const result = await collection.find({}).toArray();
    
            // Close the connection
            await client.close();
    
            res.status(200).json({ message: 'Data retrieved successfully!', result });
        } catch (error: any) {
            res.status(500).json({ message: 'Error retrieving data', error: error.message });
        }
    });
});