/**
 * When a customer deploys an instance of this integration they walk through
 * a configuration wizard. Here we collect the telematics connection, then
 * use it to populate a live dropdown of the customer's vehicles — proving
 * the customer self-serves their own setup against their own data.
 */

import {
  type Connection,
  type Element,
  configPage,
  connectionConfigVar,
  dataSourceConfigVar,
} from "@prismatic-io/spectral";
import { createTelematicsClient } from "./client";

export interface Vehicle {
  id: string;
  vehicleName: string;
  trade: string;
  engineHours: number;
  lastServiceHours: number;
  serviceIntervalHours: number;
  odometerMiles: number;
  faultCode: string | null;
  status: string;
}

export const configPages = {
  Connections: configPage({
    elements: {
      "Telematics Connection": connectionConfigVar({
        stableKey: "f0e1fbb9-8665-4150-b380-47906c89b291",
        dataType: "connection",
        inputs: {
          baseUrl: {
            label: "Fleet API Base URL",
            type: "string",
            required: true,
            default: "https://my-json-server.typicode.com/smeltser-dev/acme-x-prismatic",
            example: "https://telematics.my-carrier.com/api",
          },
          apiKey: {
            label: "Fleet API Key",
            placeholder: "Fleet API Key",
            type: "password",
            required: true,
            comments: "Any value works against the mock API.",
          },
        },
      }),
      // The FSM system where work orders get created (the write target).
      "FSM Connection": connectionConfigVar({
        stableKey: "a7d3e1c2-9f44-4b8e-bd21-3c6e10aa77b5",
        dataType: "connection",
        inputs: {
          baseUrl: {
            label: "FSM API Base URL",
            type: "string",
            required: true,
            default: "https://my-json-server.typicode.com/smeltser-dev/acme-x-prismatic",
            example: "https://acme-fsm.example.com/api",
          },
          apiKey: {
            label: "FSM API Key",
            placeholder: "FSM API Key",
            type: "password",
            required: true,
            comments: "Any value works against the mock API.",
          },
        },
      }),
    },
  }),
  "Fleet Selection": configPage({
    elements: {
      // Live-fetch the customer's vehicles into a dropdown during config.
      "Monitored Vehicle": dataSourceConfigVar({
        stableKey: "e9436a61-7916-462e-bf23-9deaeb4ef2eb",
        dataSourceType: "picklist",
        perform: async (context) => {
          const client = createTelematicsClient(
            context.configVars["Telematics Connection"] as Connection,
          );
          const { data: vehicles } = await client.get<Vehicle[]>("/vehicles");
          const options: Element[] = vehicles.map((v) => ({
            key: v.id,
            label: `${v.vehicleName} (${v.id})`,
          }));
          return { result: options };
        },
      }),
    },
  }),
};
