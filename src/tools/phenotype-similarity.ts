import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { monarchFetch } from "../lib/http";
import {
    createCodeModeResponse,
    createCodeModeError,
} from "@bio-mcp/shared/codemode/response";
import { shouldStage, stageToDoAndRespond } from "@bio-mcp/shared/staging/utils";

interface SimEnv {
    MONARCH_DATA_DO?: {
        idFromName(name: string): unknown;
        get(id: unknown): { fetch(req: Request): Promise<Response> };
    };
}

export function registerPhenotypeSimilarity(server: McpServer, env?: SimEnv) {
    server.registerTool(
        "monarch_phenotype_similarity",
        {
            title: "Cross-Species Phenotype Similarity Search",
            description:
                "Find entities with similar phenotype profiles across species. Uses semantic similarity to compare phenotype sets — essential for cross-species target validation (e.g., mouse KO phenotypes → human disease inference).",
            inputSchema: {
                phenotype_ids: z
                    .string()
                    .min(1)
                    .describe("Comma-separated phenotype CURIEs (e.g. 'HP:0001250,HP:0001263,HP:0002069')"),
                limit: z
                    .number()
                    .int()
                    .min(1)
                    .max(100)
                    .default(20)
                    .optional()
                    .describe("Max results (default: 20)"),
            },
        },
        async (args, extra) => {
            const runtimeEnv = env || (extra as { env?: SimEnv })?.env;
            try {
                const params: Record<string, unknown> = {
                    id: String(args.phenotype_ids),
                    limit: args.limit || 20,
                };

                const response = await monarchFetch("/sim/search", params);

                if (!response.ok) {
                    const body = await response.text().catch(() => "");
                    throw new Error(`Monarch API error: HTTP ${response.status}${body ? ` - ${body.slice(0, 300)}` : ""}`);
                }

                const data = await response.json();
                const results = Array.isArray(data) ? data : (data as Record<string, unknown>).matches || data;

                const responseSize = JSON.stringify(results).length;
                if (shouldStage(responseSize) && runtimeEnv?.MONARCH_DATA_DO) {
                    const staged = await stageToDoAndRespond(
                        results,
                        runtimeEnv.MONARCH_DATA_DO as any,
                        "similarity_results",
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
                            _staging: staged._staging,
                            message: `Similarity results staged. Use monarch_query_data with data_access_id '${staged.dataAccessId}' to query.`,
                        },
                        { meta: { staged: true, data_access_id: staged.dataAccessId } },
                    );
                }

                return createCodeModeResponse(
                    { matches: results },
                    { meta: { fetched_at: new Date().toISOString() } },
                );
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return createCodeModeError("API_ERROR", `monarch_phenotype_similarity failed: ${msg}`);
            }
        },
    );
}
