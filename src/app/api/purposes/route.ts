import { schema } from "@/db";
import { makeMasterRoutes } from "@/lib/master-crud";

const routes = makeMasterRoutes(schema.purposes, "purposes", "Tujuan dokumen");

export const GET = routes.GET;
export const POST = routes.POST;
