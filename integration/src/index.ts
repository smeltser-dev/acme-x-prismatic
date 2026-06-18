/**
 * Code-native integration: Acme Fleet Sync.
 *
 * Wraps a fleet-telematics feed (a custom source with no pre-built connector)
 * and raises work orders for vehicles due for service. A customer walks the
 * config wizard (configPages.ts), then the flow (flows.ts) runs on Prismatic's
 * managed runtime with full execution logs.
 */

import { integration } from "@prismatic-io/spectral";
import flows from "./flows";
import { configPages } from "./configPages";
import { componentRegistry } from "./componentRegistry";
import documentation from "../documentation.md";

export { configPages } from "./configPages";
export { componentRegistry } from "./componentRegistry";

export default integration({
  name: "acme-fleet-sync",
  description: "Acme × Prismatic — fleet telematics to work-order demo",
  iconPath: "icon.png",
  documentation,
  flows,
  configPages,
  componentRegistry,
});
