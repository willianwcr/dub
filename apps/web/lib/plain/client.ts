import { PlainClient } from "@team-plain/typescript-sdk";

let plainInstance: PlainClient | null = null;

function getPlainInstance(): PlainClient {
  if (!plainInstance) {
    const apiKey = process.env.PLAIN_API_KEY;
    if (!apiKey) {
      throw new Error(
        "PLAIN_API_KEY environment variable is not set. Please ensure it is configured.",
      );
    }
    plainInstance = new PlainClient({
      apiKey,
    });
  }
  return plainInstance;
}

// Create a proxy object that lazy-initializes the Plain client on first use
export const plain = new Proxy({} as PlainClient, {
  get(_, prop) {
    const instance = getPlainInstance();
    return (instance as any)[prop];
  },
}) as PlainClient;

export type PlainUser = {
  id: string;
  name: string | null;
  email: string | null;
};
