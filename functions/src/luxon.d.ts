declare module "luxon" {
  // Minimal typing shim for editor tooling when workspace TS server
  // doesn't resolve functions/node_modules.
  export const DateTime: any;
}
