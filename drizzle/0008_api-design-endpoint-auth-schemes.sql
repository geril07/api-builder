CREATE TABLE "api_design_endpoint_auth_schemes" (
	"endpoint_id" uuid NOT NULL,
	"auth_scheme_id" uuid NOT NULL,
	CONSTRAINT "api_design_endpoint_auth_schemes_endpoint_id_auth_scheme_id_pk" PRIMARY KEY("endpoint_id","auth_scheme_id")
);
--> statement-breakpoint
ALTER TABLE "api_design_endpoint_auth_schemes" ADD CONSTRAINT "api_design_endpoint_auth_schemes_endpoint_id_api_design_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."api_design_endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_design_endpoint_auth_schemes" ADD CONSTRAINT "api_design_endpoint_auth_schemes_auth_scheme_id_api_design_auth_schemes_id_fk" FOREIGN KEY ("auth_scheme_id") REFERENCES "public"."api_design_auth_schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_design_endpoint_auth_schemes_auth_scheme_id_index" ON "api_design_endpoint_auth_schemes" USING btree ("auth_scheme_id");--> statement-breakpoint
INSERT INTO "api_design_endpoint_auth_schemes" ("endpoint_id", "auth_scheme_id")
SELECT "endpoint_auth_scheme_ids"."endpoint_id", "api_design_auth_schemes"."id"
FROM (
	SELECT "api_design_endpoints"."id" AS "endpoint_id", "api_design_resources"."api_design_id", "auth_scheme_id"
	FROM "api_design_endpoints"
	INNER JOIN "api_design_resources" ON "api_design_resources"."id" = "api_design_endpoints"."resource_id"
	CROSS JOIN LATERAL jsonb_array_elements_text("api_design_endpoints"."auth_scheme_ids") AS "auth_scheme_ids"("auth_scheme_id")
	WHERE "auth_scheme_id" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
) AS "endpoint_auth_scheme_ids"
INNER JOIN "api_design_auth_schemes" ON "api_design_auth_schemes"."id" = "endpoint_auth_scheme_ids"."auth_scheme_id"::uuid
	AND "api_design_auth_schemes"."api_design_id" = "endpoint_auth_scheme_ids"."api_design_id"
ON CONFLICT DO NOTHING;--> statement-breakpoint
ALTER TABLE "api_design_endpoints" DROP COLUMN "auth_scheme_ids";
