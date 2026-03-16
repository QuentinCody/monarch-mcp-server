import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { monarchFetch } from "../lib/http";
import {
    createCodeModeResponse,
    createCodeModeError,
} from "@bio-mcp/shared/codemode/response";

export function registerEntityLookup(server: McpServer, _env?: unknown) {
    server.registerTool(
        "monarch_entity_lookup",
        {
            title: "Look Up Entity Details",
            description:
                "Get detailed information about a gene, disease, or phenotype from the Monarch knowledge graph by its CURIE identifier.",
            inputSchema: {
                entity_id: z
                    .string()
                    .min(1)
                    .describe("Entity CURIE (e.g. 'HGNC:1100' for BRCA1, 'MONDO:0007254', 'HP:0001250')"),
            },
        },
        async (args) => {
            try {
                const entityId = String(args.entity_id).trim();
                const response = await monarchFetch(`/entity/${encodeURIComponent(entityId)}`);

                if (!response.ok) {
                    const body = await response.text().catch(() => "");
                    throw new Error(`Monarch API error: HTTP ${response.status}${body ? ` - ${body.slice(0, 300)}` : ""}`);
                }

                const data = await response.json();

                return createCodeModeResponse(data, {
                    meta: { fetched_at: new Date().toISOString() },
                });
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return createCodeModeError("API_ERROR", `monarch_entity_lookup failed: ${msg}`);
            }
        },
    );
}
