import mongoose from "mongoose";
import {
  BufferJSON,
  initAuthCreds,
  proto,
  type AuthenticationState,
  type SignalDataSet,
  type SignalDataTypeMap,
  type SignalKeyStore,
} from "@whiskeysockets/baileys";

const COLLECTION = "baileys_auth";
const CREDS_KEY = "creds";

interface StoredValue {
  _id: string;
  value: string;
}

export async function useMongoAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB no está conectada");
  const collection = db.collection<StoredValue>(COLLECTION);

  const readData = async (key: string): Promise<any> => {
    const doc = await collection.findOne({ _id: key });
    if (!doc?.value) return null;
    return JSON.parse(doc.value, BufferJSON.reviver);
  };

  const writeData = async (key: string, data: unknown): Promise<void> => {
    const value = JSON.stringify(data, BufferJSON.replacer);
    await collection.updateOne({ _id: key }, { $set: { value } }, { upsert: true });
  };

  const removeData = async (key: string): Promise<void> => {
    await collection.deleteOne({ _id: key });
  };

  const creds: AuthenticationState["creds"] = (await readData(CREDS_KEY)) || initAuthCreds();

  const keys: SignalKeyStore = {
    get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
      const data: { [id: string]: SignalDataTypeMap[T] } = {};
      await Promise.all(
        ids.map(async (id) => {
          let value = await readData(`${type}-${id}`);
          if (type === "app-state-sync-key" && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(value);
          }
          data[id] = value;
        }),
      );
      return data;
    },
    set: async (data: SignalDataSet) => {
      const tasks: Promise<void>[] = [];
      for (const category of Object.keys(data) as (keyof SignalDataSet)[]) {
        const entries = data[category] ?? {};
        for (const [id, value] of Object.entries(entries)) {
          const key = `${category}-${id}`;
          tasks.push(value ? writeData(key, value) : removeData(key));
        }
      }
      await Promise.all(tasks);
    },
    clear: async () => {
      await collection.deleteMany({ _id: { $ne: CREDS_KEY } });
    },
  };

  return {
    state: { creds, keys },
    saveCreds: () => writeData(CREDS_KEY, creds),
  };
}
