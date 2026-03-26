import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { monarchFetch } from "../lib/http";
import {
    createCodeModeResponse,
    createCodeModeError,
} from "@bio-mcp/shared/codemode/response";
import { shouldStage, stageToDoAndRespond } from "@bio-mcp/shared/staging/utils";

interface AssocEnv {
    MONARCH_DATA_DO?: {
        idFromName(name: string): unknown;
        get(id: unknown): { fetch(req: Request): Promise<Response> };
    };
}

export function registerAssociationSearch(server: McpServer, env?: AssocEnv): void {
    server.registerTool(
        "monarch_association_search",
        {
            title: "Search Gene-Phenotype-Disease Associations",
            description:
                "Search the Monarch Initiative knowledge graph for associations between genes, diseases, and phenotypes. Supports cross-species data from OMIM, HPO, MGI, ZFIN.",
            inputSchema: {
                subject: z
                    .string()
                    .optional()
                    .describe("Subject entity CURIE (e.g. 'HGNC:1100' for BRCA1, 'MONDO:0007254' for breast cancer)"),
                object: z
                    .string()
                    .optional()
                    .describe("Object entity CURIE (e.g. 'HP:0001250' for seizures)"),
                category: z
                    .string()
                    .optional()
                    .describe("Association category (e.g. 'biolink:GeneToPhenotypicFeatureAssociation', 'biolink:GeneToDiseaseAssociation', 'biolink:DiseaseToPhenotypicFeatureAssociation')"),
                limit: z
                    .number()
                    .int()
                    .min(1)
                    .max(500)
                    .default(100)
                    .optional()
                    .describe("Max results (default: 100, max: 500)"),
                offset: z
                    .number()
                    .int()
                    .min(0)
                    .default(0)
                    .optional()
                    .describe("Pagination offset"),
            },
        },
        async (args, extra) => {
            const runtimeEnv = env || (extra as { env?: AssocEnv })?.env;
            try {
                const params: Record<string, unknown> = {};
                if (args.subject) params.subject = String(args.subject);
                if (args.object) params.object = String(args.object);
                if (args.category) params.category = String(args.category);
                params.limit = args.limit || 100;
                if (args.offset) params.offset = args.offset;

                const response = await monarchFetch("/association", params);

                if (!response.ok) {
                    const body = await response.text().catch(() => "");
                    throw new Error(`Monarch API error: HTTP ${response.status}${body ? ` - ${body.slice(0, 300)}` : ""}`);
                }

                const data = await response.json() as Record<string, unknown>;
                const items = (data.items || data.associations || []) as unknown[];

                const responseSize = JSON.stringify(items).length;
                if (shouldStage(responseSize) && runtimeEnv?.MONARCH_DATA_DO) {
                    const staged = await stageToDoAndRespond(
                        items,
                        runtimeEnv.MONARCH_DATA_DO as DurableObjectNamespace,
                        "associations",
                        undefined,
                        undefined,
                        "monarch",
                        (extra as { sessionId?: string })?.sessionId,
                    );
                    return createCodeModeResponse(
                        {
                            staged: true,
                            data_access_id: staged.dataAccessId,
                            total_rows: staged.totalRows,
                            total: data.total,
                            _staging: staged._staging,
                            message: `Association data staged (${items.length} items). Use monarch_query_data with data_access_id '${staged.dataAccessId}' to query.`,
                        },
                        { meta: { staged: true, data_access_id: staged.dataAccessId } },
                    );
                }

                return createCodeModeResponse(
                    {
                        associations: items,
                        total: data.total,
                        offset: data.offset,
                        limit: data.limit,
                    },
                    { meta: { fetched_at: new Date().toISOString(), total: data.total } },
                );
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return createCodeModeError("API_ERROR", `monarch_association_search failed: ${msg}`);
            }
        },
    );
}
