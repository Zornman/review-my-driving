import * as functions from 'firebase-functions/v2';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const corsHandler = cors({ origin: true });

export const updateSampleMapper = functions
.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method Not Allowed' });
      return;
    }
  
    const uri = process.env['MONGO_URI'];
    const client = new MongoClient(uri);
  
    try {
      const data = req.body;
      await client.connect();
  
      const database = client.db('review_my_driving');
      const mapperCollection = database.collection('sample_mapper');
      const batchCollection = database.collection('sample_batches');
  
      // 1️⃣ Update the sample_mapper document
      const mapperResult = await mapperCollection.findOneAndUpdate(
        { uniqueId: data.uniqueId },
        { $set: { userId: data.userId, status: data.status, claimedAt: new Date() } },
        { returnDocument: "after" }
      );

      if (!mapperResult || !mapperResult['metadata']) {
        throw new Error("Mapper document not found or missing metadata.");
      }

      const { batchNumber, campaignId } = mapperResult['metadata'];

      // 2️⃣ Get the current batch record
      const batchDoc = await batchCollection.findOne({ batchNumber, campaignId });

      if (!batchDoc) {
        throw new Error("Batch document not found.");
      }

      // 3️⃣ Calculate updated values
      const updatedClaimed = (batchDoc['claimedCount'] || 0) + 1;
      const updatedUnclaimed = Math.max((batchDoc['unclaimedCount'] || 0) - 1, 0);

      // 4️⃣ Update the batch with new values
      const batchUpdateResult = await batchCollection.updateOne(
        { batchNumber, campaignId },
        {
          $set: {
            claimedCount: updatedClaimed,
            unclaimedCount: updatedUnclaimed,
            updatedAt: new Date(),
          },
        }
      );
  
      await client.close();
  
      res.status(200).json({ 
        message: 'Data updated successfully!', 
        sampleResult: mapperResult,
        batchUpdate: batchUpdateResult 
      });
    } catch (error) {
      console.error('Error updating data:', error);
      res.status(500).json({ message: 'Error updating data', error: error.message });
    }
  });
});
