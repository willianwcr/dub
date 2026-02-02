import Stripe from "stripe";
import { StripeMode } from "../types";

// Lazy-initialize Stripe client to avoid errors during build when API key is not available
let stripeInstance: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error(
        "STRIPE_SECRET_KEY environment variable is not set. Please ensure it is configured.",
      );
    }
    stripeInstance = new Stripe(apiKey, {
      apiVersion: "2025-05-28.basil",
      appInfo: {
        name: "Dub.co",
        version: "0.1.0",
      },
    });
  }
  return stripeInstance;
}

// Create a proxy object that lazy-initializes the Stripe client on first use
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    const instance = getStripeInstance();
    return (instance as any)[prop];
  },
}) as Stripe;

const secretMap: Record<StripeMode, string | undefined> = {
  live: process.env.STRIPE_APP_SECRET_KEY,
  test: process.env.STRIPE_APP_SECRET_KEY_TEST,
  sandbox: process.env.STRIPE_APP_SECRET_KEY_SANDBOX,
};

// Stripe Integration App client
export const stripeAppClient = ({ mode }: { mode?: StripeMode }) => {
  const appSecretKey = secretMap[mode ?? "test"];

  if (!appSecretKey) {
    // Return a proxy that throws the error on first actual use, not on instantiation
    return new Proxy({} as Stripe, {
      get() {
        throw new Error(
          `Stripe app secret key is not configured for mode "${mode}". Check your environment variables.`,
        );
      },
    }) as Stripe;
  }

  let appInstance: Stripe | null = null;

  return new Proxy({} as Stripe, {
    get(_, prop) {
      if (!appInstance) {
        appInstance = new Stripe(appSecretKey, {
          apiVersion: "2025-05-28.basil",
          appInfo: {
            name: "Dub.co",
            version: "0.1.0",
          },
        });
      }
      return (appInstance as any)[prop];
    },
  }) as Stripe;
};
