import { schema } from "@/db";
import { makeMasterRoutes } from "@/lib/master-crud";

const routes = makeMasterRoutes(schema.documentTypes, "types", "Jenis dokumen");

export const DELETE = routes.DELETE;
