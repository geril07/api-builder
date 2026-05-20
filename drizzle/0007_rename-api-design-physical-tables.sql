ALTER TABLE "auth_schemes" RENAME TO "api_design_auth_schemes";--> statement-breakpoint
ALTER TABLE "endpoints" RENAME TO "api_design_endpoints";--> statement-breakpoint
ALTER TABLE "resources" RENAME TO "api_design_resources";--> statement-breakpoint
ALTER TABLE "schemas" RENAME TO "api_design_schemas";--> statement-breakpoint
ALTER TABLE "api_design_auth_schemes" DROP CONSTRAINT "auth_schemes_type_check";--> statement-breakpoint
ALTER TABLE "api_design_endpoints" DROP CONSTRAINT "endpoints_method_check";--> statement-breakpoint
ALTER TABLE "api_design_auth_schemes" DROP CONSTRAINT "auth_schemes_api_design_id_api_designs_id_fk";
--> statement-breakpoint
ALTER TABLE "api_design_endpoints" DROP CONSTRAINT "endpoints_resource_id_resources_id_fk";
--> statement-breakpoint
ALTER TABLE "api_design_endpoints" DROP CONSTRAINT "endpoints_request_body_schema_id_schemas_id_fk";
--> statement-breakpoint
ALTER TABLE "api_design_endpoints" DROP CONSTRAINT "endpoints_response_shape_schema_id_schemas_id_fk";
--> statement-breakpoint
ALTER TABLE "api_design_resources" DROP CONSTRAINT "resources_api_design_id_api_designs_id_fk";
--> statement-breakpoint
ALTER TABLE "api_design_schemas" DROP CONSTRAINT "schemas_api_design_id_api_designs_id_fk";
--> statement-breakpoint
DROP INDEX "auth_schemes_api_design_id_index";--> statement-breakpoint
DROP INDEX "endpoints_resource_id_index";--> statement-breakpoint
DROP INDEX "endpoints_resource_sort_order_index";--> statement-breakpoint
DROP INDEX "endpoints_request_body_schema_id_index";--> statement-breakpoint
DROP INDEX "endpoints_response_shape_schema_id_index";--> statement-breakpoint
DROP INDEX "resources_api_design_id_index";--> statement-breakpoint
DROP INDEX "schemas_api_design_id_index";--> statement-breakpoint
ALTER TABLE "api_design_auth_schemes" ADD CONSTRAINT "api_design_auth_schemes_api_design_id_api_designs_id_fk" FOREIGN KEY ("api_design_id") REFERENCES "public"."api_designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_design_endpoints" ADD CONSTRAINT "api_design_endpoints_resource_id_api_design_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."api_design_resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_design_endpoints" ADD CONSTRAINT "api_design_endpoints_request_body_schema_id_api_design_schemas_id_fk" FOREIGN KEY ("request_body_schema_id") REFERENCES "public"."api_design_schemas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_design_endpoints" ADD CONSTRAINT "api_design_endpoints_response_shape_schema_id_api_design_schemas_id_fk" FOREIGN KEY ("response_shape_schema_id") REFERENCES "public"."api_design_schemas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_design_resources" ADD CONSTRAINT "api_design_resources_api_design_id_api_designs_id_fk" FOREIGN KEY ("api_design_id") REFERENCES "public"."api_designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_design_schemas" ADD CONSTRAINT "api_design_schemas_api_design_id_api_designs_id_fk" FOREIGN KEY ("api_design_id") REFERENCES "public"."api_designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_design_auth_schemes_api_design_id_index" ON "api_design_auth_schemes" USING btree ("api_design_id");--> statement-breakpoint
CREATE INDEX "api_design_endpoints_resource_id_index" ON "api_design_endpoints" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "api_design_endpoints_resource_sort_order_index" ON "api_design_endpoints" USING btree ("resource_id","sort_order");--> statement-breakpoint
CREATE INDEX "api_design_endpoints_request_body_schema_id_index" ON "api_design_endpoints" USING btree ("request_body_schema_id");--> statement-breakpoint
CREATE INDEX "api_design_endpoints_response_shape_schema_id_index" ON "api_design_endpoints" USING btree ("response_shape_schema_id");--> statement-breakpoint
CREATE INDEX "api_design_resources_api_design_id_index" ON "api_design_resources" USING btree ("api_design_id");--> statement-breakpoint
CREATE INDEX "api_design_schemas_api_design_id_index" ON "api_design_schemas" USING btree ("api_design_id");--> statement-breakpoint
ALTER TABLE "api_design_auth_schemes" ADD CONSTRAINT "api_design_auth_schemes_type_check" CHECK ("api_design_auth_schemes"."type" IN ('bearer', 'apiKey', 'oauth2', 'openIdConnect'));--> statement-breakpoint
ALTER TABLE "api_design_endpoints" ADD CONSTRAINT "api_design_endpoints_method_check" CHECK ("api_design_endpoints"."method" IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'));