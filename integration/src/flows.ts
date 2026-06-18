/**
 * Flow: Flag Vehicles For Service.
 *
 * Pulls fleet telematics, then for every vehicle either past its service
 * interval or reporting a fault code, raises a work order. This is the
 * "weird custom source -> code-native fills the gap" story for Acme: the
 * carrier's telematics feed isn't a pre-built connector, so we wrap it in
 * TypeScript and run business logic on it inside Prismatic's runtime.
 */

import { flow } from "@prismatic-io/spectral";
import { createTelematicsClient } from "./client";
import type { Vehicle } from "./configPages";

interface WorkOrder {
  vehicleId: string;
  vehicleName: string;
  trade: string;
  reasons: string[];
  odometerMiles: number;
}

export const flagVehiclesForService = flow({
  name: "Flag Vehicles For Service",
  stableKey: "ac347e39-d761-4029-b158-fb45baab2cdf",
  description:
    "Pull fleet telematics, flag vehicles due for service or reporting a fault, and raise a work order for each.",
  onTrigger: async (context, payload) => {
    if (context.debug.enabled) {
      context.logger.debug(`Trigger payload: ${JSON.stringify(payload)}`);
    }
    return Promise.resolve({ payload });
  },
  onExecution: async (context) => {
    const { logger, configVars } = context;
    logger.info(
      `Scanning fleet telematics (monitored vehicle config: "${configVars["Monitored Vehicle"]}")`,
    );

    const client = createTelematicsClient(configVars["Telematics Connection"]);
    const { data: vehicles } = await client.get<Vehicle[]>("/vehicles");
    logger.info(`Pulled ${vehicles.length} vehicles from telematics.`);

    const workOrders: WorkOrder[] = [];
    for (const v of vehicles) {
      const hoursSinceService = v.engineHours - v.lastServiceHours;
      const reasons: string[] = [];
      if (hoursSinceService >= v.serviceIntervalHours) {
        reasons.push(
          `service interval exceeded (${hoursSinceService}h since last service, interval ${v.serviceIntervalHours}h)`,
        );
      }
      if (v.faultCode) {
        reasons.push(`fault code ${v.faultCode}`);
      }
      if (reasons.length > 0) {
        workOrders.push({
          vehicleId: v.id,
          vehicleName: v.vehicleName,
          trade: v.trade,
          reasons,
          odometerMiles: v.odometerMiles,
        });
        logger.info(`Work order: ${v.vehicleName} (${v.id}) — ${reasons.join("; ")}`);
      }
    }

    logger.info(`Raised ${workOrders.length} work order(s) from ${vehicles.length} vehicles scanned.`);

    return { data: { workOrders, scanned: vehicles.length } };
  },
});

export default [flagVehiclesForService];
