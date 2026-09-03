import { schema } from "@/db";
import { makeMasterRoutes } from "@/lib/master-crud";

const routes = makeMasterRoutes(schema.documentTypes, "types", "Jenis dokumen");

export const GET = routes.GET;
export const POST = routes.POST;
