// the server entry `vite dev` renders pages with (see vite.config.ts)
import { AppRoutes } from "#server/routes";
import { document } from "virtual:@effect/ui/document";

export default AppRoutes(document);
