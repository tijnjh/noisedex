// thin server-function clients per platform, over the domain modules in #lib.
// platform files import domain modules directly, never this barrel.
export * as $spotify from "./platforms/spotify";
export * as $everynoise from "./platforms/everynoise";
export * as $itunes from "./platforms/itunes";
