# acme-fleet-sync — code-native Prismatic integration

Wraps Acme's fleet-telematics feed and raises service work orders. Built with the Prismatic **Spectral** SDK (TypeScript) and imported via the `prism` CLI.

## What it does

- **Connection** (`Telematics Connection`) — base URL + API key for the fleet API.
- **Config wizard** (`Fleet Selection`) — a `dataSource` dropdown that **live-fetches the customer's own vehicles** from `/vehicles` during setup.
- **Flow** (`Flag Vehicles For Service`) — pulls all vehicles, flags any past `serviceIntervalHours` since last service **or** reporting a `faultCode`, and raises a work order for each. Returns `{ workOrders, scanned }` and logs every decision.

## Run it

```bash
npm install
npm test        # invokes the flow against the mock API
```

Expected: **5 scanned → 2 work orders** — `WRX-114` (240h over interval + fault `P0420`) and `WRX-133` (222h over).

## Import to your own Prismatic org

```bash
npx prism login
npm run import  # webpack build, then prism integrations:import
```

## Mock data

The telematics API is mocked by [`../db.json`](../db.json), served via [my-json-server](https://my-json-server.typicode.com/smeltser-dev/acme-x-prismatic/vehicles). For an offline local mock: `npx json-server ../db.json`.

## Files

| File | Purpose |
|---|---|
| `src/client.ts` | Authenticated HTTP client for the telematics API |
| `src/configPages.ts` | Connection + live vehicle dropdown (config wizard) |
| `src/flows.ts` | The `Flag Vehicles For Service` flow |
| `src/index.ts` | Integration definition |
| `src/flows.test.ts` | Local tests (run against the mock) |
