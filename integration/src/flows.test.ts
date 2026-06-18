/**
 * Local tests for the Flag Vehicles For Service flow. Runs the flow against
 * the live mock telematics API and asserts which vehicles get a work order.
 *
 * Run with "npm run test".
 */

import { invokeFlow } from "@prismatic-io/spectral/dist/testing";
import dotenv from "dotenv";
import { flagVehiclesForService } from "./flows";

dotenv.config({ path: ".env.testing" });

const telematicsConnection = {
  key: "Telematics Connection",
  fields: {
    baseUrl: process.env.FLEET_ENDPOINT,
    apiKey: process.env.FLEET_API_KEY,
  },
};

const configVars = {
  "Telematics Connection": telematicsConnection,
  "Monitored Vehicle": "WRX-114",
};

interface FlagResult {
  workOrders: Array<{ vehicleId: string; reasons: string[] }>;
  scanned: number;
}

describe("Flag Vehicles For Service", () => {
  test("raises a work order for each vehicle due or faulting", async () => {
    const { result } = await invokeFlow(flagVehiclesForService, { configVars });
    const data = result?.data as FlagResult;
    expect(data.scanned).toBe(5);
    expect(data.workOrders.map((w) => w.vehicleId)).toStrictEqual(["WRX-114", "WRX-133"]);
  });

  test("captures both the interval and the fault-code reasons", async () => {
    const { result } = await invokeFlow(flagVehiclesForService, { configVars });
    const data = result?.data as FlagResult;
    const wo114 = data.workOrders.find((w) => w.vehicleId === "WRX-114");
    expect(wo114?.reasons).toHaveLength(2);
    expect(wo114?.reasons.some((r) => r.includes("fault code P0420"))).toBe(true);
  });
});
