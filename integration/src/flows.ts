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

    logger.info(
      `Flagged ${workOrders.length} of ${vehicles.length} vehicles. Creating work orders in the FSM system...`,
    );

    // Create each work order in the FSM system — the second half of the integration.
    const fsmClient = createTelematicsClient(configVars["FSM Connection"]);
    const createdWorkOrders: { vehicleId: string; workOrderId: string | number }[] = [];
    for (const wo of workOrders) {
      const { data: created } = await fsmClient.post("/workOrders", {
        vehicleId: wo.vehicleId,
        vehicleName: wo.vehicleName,
        trade: wo.trade,
        reasons: wo.reasons,
        odometerMiles: wo.odometerMiles,
        status: "open",
      });
      const workOrderId = (created as { id: string | number }).id;
      createdWorkOrders.push({ vehicleId: wo.vehicleId, workOrderId });
      logger.info(`Created FSM work order ${workOrderId} for ${wo.vehicleName} (${wo.vehicleId}).`);
    }

    logger.info(`Created ${createdWorkOrders.length} work order(s) in the FSM system.`);
    return { data: { workOrders, createdWorkOrders, scanned: vehicles.length } };
  },
});

export default [flagVehiclesForService];
