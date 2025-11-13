import type { Station, Location } from "@/core/domain/station";
import type { StationService } from "@/core/application/interfaces/station-service";
import clientPromise from "@/infrastructure/db/mongo";

/**
 * MongoDB document interface for Station collection
 */
interface StationDocument {
  _id: number;
  name: string;
  image?: string;
  address: string;
  location: Location;
  createdAt: Date;
  updatedAt: Date;
}

const getNextStationId = async (): Promise<number> => {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  const lastStation = await db.collection<StationDocument>("stations").findOne({}, { sort: { _id: -1 } });
  return lastStation ? lastStation._id + 1 : 1;
};

export const stationRepository: StationService & {
  getNextId(): Promise<number>;
} = {
  async getAll(): Promise<Station[]> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const docs = await db.collection<StationDocument>("stations").find({}).sort({ _id: 1 }).toArray();
    return docs.map((d) => ({
      id: d._id,
      name: d.name,
      image: d.image,
      address: d.address,
      location: d.location,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  },

  async getById(id: number): Promise<Station | null> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const doc = await db.collection<StationDocument>("stations").findOne({ _id: id });
    return doc ? {
      id: doc._id,
      name: doc.name,
      image: doc.image,
      address: doc.address,
      location: doc.location,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    } : null;
  },

  async create(station: Omit<Station, "id" | "createdAt" | "updatedAt">): Promise<Station> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const id = await getNextStationId();
    const now = new Date();
    const doc: StationDocument = {
      _id: id,
      name: station.name,
      image: station.image,
      address: station.address,
      location: station.location,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection<StationDocument>("stations").insertOne(doc);
    return {
      id,
      name: station.name,
      image: station.image,
      address: station.address,
      location: station.location,
      createdAt: now,
      updatedAt: now,
    };
  },

  async update(id: number, station: Partial<Omit<Station, "id" | "createdAt" | "updatedAt">>): Promise<Station | null> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const updateObj: Partial<StationDocument> = {
      ...station,
      updatedAt: new Date()
    };

    const result = await db.collection<StationDocument>("stations").findOneAndUpdate(
      { _id: id },
      { $set: updateObj },
      { returnDocument: "after" }
    );

    if (result) {
      return {
        id: result._id,
        name: result.name,
        image: result.image,
        address: result.address,
        location: result.location,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    }
    return null;
  },

  async delete(id: number): Promise<boolean> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const result = await db.collection<StationDocument>("stations").deleteOne({ _id: id });
    return result.deletedCount > 0;
  },

  getNextId: getNextStationId,
};
