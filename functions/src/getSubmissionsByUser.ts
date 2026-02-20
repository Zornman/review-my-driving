import * as functions from 'firebase-functions/v2';
import { Db, MongoClient } from 'mongodb';
import cors from 'cors';
import { isValidObjectIdString, toObjectId } from './_shared/http.js';

const corsHandler = cors({ origin: true });

export const getSubmissionsByUser = functions
.https.onRequest({ secrets: ["MONGO_URI"] }, async (req, res) => {
  
  corsHandler(req, res, async () => {
    const uri = process.env['MONGO_URI'] as string;
    const client = new MongoClient(uri);
    // Backwards-compatible query params:
    // - userID/userId: submissions for a given Firebase UID (also includes uniqueId-only submissions mapped to that user)
    // - uniqueId: submissions for a sample QR
    // - businessId(+assetId): submissions for a business QR (assetId optional)
    const userId = (req.query['userID'] as string) || (req.query['userId'] as string) || '';
    const uniqueId = (req.query['uniqueId'] as string) || '';
    const businessId = (req.query['businessId'] as string) || '';
    const assetId = (req.query['assetId'] as string) || '';

    const hasUser = !!userId;
    const hasUniqueId = !!uniqueId;
    const hasBusiness = !!businessId;

    if (!hasUser && !hasUniqueId && !hasBusiness) {
      res.status(400).json({ error: 'Missing identifier. Provide userID, uniqueId, or businessId (+ optional assetId).' });
      return;
    }
  
    try {
      // Connect to MongoDB
      await client.connect();
  
      // Select the database and collection
      const database = client.db('review_my_driving'); // Replace 'myDatabase' with your database name
      const collection = database.collection('submissions'); // Replace 'myCollection' with your collection name

      // Determine query mode
      let query: any = null;

      if (hasUser) {
        const orClauses: any[] = [{ user_id: userId }];

        // If the user claimed sample uniqueIds, include those submissions too
        try {
          const mapper = database.collection('sample_mapper');
          const rows = await mapper
            .find({ userId })
            .project({ uniqueId: 1, _id: 0 })
            .toArray();

          const uniqueIds = rows.map((r: any) => r.uniqueId).filter((x: any) => typeof x === 'string' && x.trim().length > 0);
          if (uniqueIds.length) {
            orClauses.push({ uniqueId: { $in: uniqueIds } });
          }
        } catch (e) {
          // best-effort only; still return user_id submissions
        }

        query = { $or: orClauses };
      } else if (hasUniqueId) {
        query = { uniqueId };
      } else if (hasBusiness) {
        const businessIdCandidates: Array<string | any> = [businessId];
        if (isValidObjectIdString(businessId)) {
          businessIdCandidates.push(toObjectId(businessId, 'businessId'));
        }

        const businessMatch = { $or: businessIdCandidates.map((id) => ({ businessId: id })) };
        query = assetId ? { $and: [businessMatch, { assetId }] } : businessMatch;
      }

      const submissions = await collection.find(query).toArray();

      // Enrich business submissions with truck + driver context (best-effort)
      const enriched = await enrichBusinessContext(database, submissions);

      res.status(200).json({ message: 'Data retrieved successfully!', submissions: enriched });
    } catch (error: any) {
      res.status(500).json({ message: 'Error getting data', error: error.message });
    } finally {
      try {
        await client.close();
      } catch {
        // ignore
      }
    }
  });
});

type BusinessQrDoc = {
  uniqueId?: string;
  assetId?: string;
  businessId?: any;
  businessName?: string;
  status?: string;
  truckId?: string | null; // stored as trucks._id string
  metadata?: any;
};

type TruckDoc = {
  _id?: any;
  truckId?: string;
  licensePlate?: string;
  state?: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  status?: string;
  assignment?: {
    assignedDriverId?: any;
    [key: string]: any;
  };
  [key: string]: any;
};

type DriverDoc = {
  _id?: any;
  driverId?: string;
  name?: string;
  phone?: string;
  email?: string;
  status?: string;
  [key: string]: any;
};

async function enrichBusinessContext(db: Db, submissions: any[]): Promise<any[]> {
  if (!Array.isArray(submissions) || submissions.length === 0) return submissions;

  // Only business submissions have (businessId + assetId). Others pass through unchanged.
  const businessSubmissions = submissions.filter(
    (s) => s && typeof s === 'object' && s.businessId && s.assetId
  );

  if (businessSubmissions.length === 0) return submissions;

  const qrCollection = db.collection<BusinessQrDoc>('business_QRCodes');
  const trucksCollection = db.collection<TruckDoc>('trucks');
  const driversCollection = db.collection<DriverDoc>('drivers');

  // Group by businessId to reuse the businessId-candidate matching logic
  const byBusinessId = new Map<string, any[]>();
  for (const s of businessSubmissions) {
    const key = String(s.businessId);
    const list = byBusinessId.get(key) ?? [];
    list.push(s);
    byBusinessId.set(key, list);
  }

  // Build assetId -> qrDoc map (across all businesses)
  const qrByBusinessAndAsset = new Map<string, BusinessQrDoc>();

  for (const [businessIdRaw, subs] of byBusinessId.entries()) {
    const assetIds = Array.from(
      new Set(
        subs
          .map((s) => (s?.assetId ?? '').toString().trim())
          .filter((x) => x.length > 0)
      )
    );
    if (assetIds.length === 0) continue;

    const businessIdCandidates: Array<string | any> = [businessIdRaw];
    if (isValidObjectIdString(businessIdRaw)) {
      businessIdCandidates.push(toObjectId(businessIdRaw, 'businessId'));
    }

    const businessMatch = {
      $or: [
        ...businessIdCandidates.map((id) => ({ businessId: id })),
        { businessName: businessIdRaw },
        { 'metadata.businessId': businessIdRaw },
      ],
    };

    const docs = await qrCollection
      .find({
        $and: [
          { $or: [{ assetId: { $in: assetIds } }, { uniqueId: { $in: assetIds } }] },
          businessMatch,
        ],
      })
      .toArray();

    for (const d of docs) {
      const resolvedAssetId = (d?.assetId ?? d?.uniqueId ?? '') as string;
      if (!resolvedAssetId) continue;
      qrByBusinessAndAsset.set(`${businessIdRaw}::${resolvedAssetId}`, d);
    }
  }

  // Collect truck ObjectIds from qr docs
  const truckObjectIds = Array.from(
    new Set(
      Array.from(qrByBusinessAndAsset.values())
        .map((d) => (d?.truckId ?? '').toString().trim())
        .filter((id) => isValidObjectIdString(id))
    )
  ).map((id) => toObjectId(id, '_id'));

  const trucks = truckObjectIds.length ? await trucksCollection.find({ _id: { $in: truckObjectIds } }).toArray() : [];
  const trucksById = new Map<string, TruckDoc>();
  for (const t of trucks) {
    if (t?._id) trucksById.set(String(t._id), t);
  }

  // Collect assigned driver ObjectIds from trucks
  const driverObjectIds: any[] = [];
  for (const t of trucks) {
    const assigned = (t as any)?.assignment?.assignedDriverId;
    if (!assigned) continue;

    // Usually stored as ObjectId, but tolerate string
    if (typeof assigned === 'string') {
      const trimmed = assigned.trim();
      if (isValidObjectIdString(trimmed)) {
        driverObjectIds.push(toObjectId(trimmed, '_id'));
      }
    } else {
      // ObjectId-ish
      driverObjectIds.push(assigned);
    }
  }

  const uniqueDriverIds = Array.from(new Set(driverObjectIds.map((x) => String(x))));
  const driverObjectIdsUnique = uniqueDriverIds
    .filter((id) => isValidObjectIdString(id))
    .map((id) => toObjectId(id, '_id'));

  const drivers = driverObjectIdsUnique.length
    ? await driversCollection.find({ _id: { $in: driverObjectIdsUnique } }).toArray()
    : [];
  const driversById = new Map<string, DriverDoc>();
  for (const d of drivers) {
    if (d?._id) driversById.set(String(d._id), d);
  }

  // Attach context per submission (non-breaking: new field)
  return submissions.map((s) => {
    if (!s || typeof s !== 'object' || !s.businessId || !s.assetId) return s;

    const businessKey = String(s.businessId);
    const assetKey = String(s.assetId);
    const qr = qrByBusinessAndAsset.get(`${businessKey}::${assetKey}`) ?? null;

    const truckId = qr?.truckId ? String(qr.truckId) : null;
    const truck = truckId ? (trucksById.get(truckId) ?? null) : null;

    const assignedDriverId = (truck as any)?.assignment?.assignedDriverId ?? null;
    const driver = assignedDriverId ? (driversById.get(String(assignedDriverId)) ?? null) : null;

    const driverLite = driver
      ? {
          _id: driver._id,
          driverId: driver.driverId ?? null,
          name: driver.name ?? null,
          phone: driver.phone ?? null,
        }
      : null;

    return {
      ...s,
      businessContext: {
        assetId: s.assetId,
        businessId: s.businessId,
        qr: qr
          ? {
              status: qr.status ?? null,
              truckId: qr.truckId ?? null,
            }
          : null,
        truck,
        driver: driverLite,
      },
    };
  });
}
