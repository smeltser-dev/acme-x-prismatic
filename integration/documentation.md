# acme-fleet-sync

Wraps a fleet-telematics feed (a custom source with no pre-built connector) and raises a work order for every vehicle past its service interval or reporting a fault code — then creates each work order in the FSM system.

- **Telematics Connection** — the fleet/telematics API the integration reads from.
- **FSM Connection** — the field-service system where work orders are created.
- **Flow: Flag Vehicles For Service** — scans vehicles, flags those due, and POSTs a work order for each.
