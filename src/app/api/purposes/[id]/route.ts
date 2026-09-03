import { schema } from "@/db";
import { makeMasterRoutes } from "@/lib/master-crud";

const routes = makeMasterRoutes(schema.purposes, "purposes", "Tujuan dokumen");

export const DELETE = routes.DELETE;
