CREATE TABLE "auth_schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_design_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_schemes_type_check" CHECK ("auth_schemes"."type" IN ('bearer', 'apiKey', 'oauth2', 'openIdConnect'))
);
--> statement-breakpoint
CREATE TABLE "schemas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_design_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"json_schema" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "endpoints" ADD COLUMN "request_body_schema_id" uuid;--> statement-breakpoint
ALTER TABLE "endpoints" ADD COLUMN "response_shape_schema_id" uuid;--> statement-breakpoint
ALTER TABLE "endpoints" ADD COLUMN "auth_scheme_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_schemes" ADD CONSTRAINT "auth_schemes_api_design_id_api_designs_id_fk" FOREIGN KEY ("api_design_id") REFERENCES "public"."api_designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schemas" ADD CONSTRAINT "schemas_api_design_id_api_designs_id_fk" FOREIGN KEY ("api_design_id") REFERENCES "public"."api_designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_schemes_api_design_id_index" ON "auth_schemes" USING btree ("api_design_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_schemes_api_design_name_unique" ON "auth_schemes" USING btree ("api_design_id","name");--> statement-breakpoint
CREATE INDEX "schemas_api_design_id_index" ON "schemas" USING btree ("api_design_id");--> statement-breakpoint
CREATE UNIQUE INDEX "schemas_api_design_name_unique" ON "schemas" USING btree ("api_design_id","name");--> statement-breakpoint
ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_request_body_schema_id_schemas_id_fk" FOREIGN KEY ("request_body_schema_id") REFERENCES "public"."schemas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_response_shape_schema_id_schemas_id_fk" FOREIGN KEY ("response_shape_schema_id") REFERENCES "public"."schemas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "endpoints_request_body_schema_id_index" ON "endpoints" USING btree ("request_body_schema_id");--> statement-breakpoint
CREATE INDEX "endpoints_response_shape_schema_id_index" ON "endpoints" USING btree ("response_shape_schema_id");