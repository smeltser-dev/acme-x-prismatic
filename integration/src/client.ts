/**
 * Reusable, authenticated HTTP client for the fleet-telematics API.
 *
 * The client receives a connection created when a customer completes the
 * configuration wizard. The base URL + API key from that connection are
 * used to build the client. In Acme's real world this wraps the carrier's
 * custom/SOAP telematics endpoint; here it points at a mock REST API.
 */

import { type Connection, util } from "@prismatic-io/spectral";
import { createClient } from "@prismatic-io/spectral/dist/clients/http";

export function createTelematicsClient(connection: Connection) {
  const { apiKey, baseUrl } = connection.fields;

  return createClient({
    baseUrl: util.types.toString(baseUrl),
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
}
