import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createSearchTool } from "@bio-mcp/shared/codemode/search-tool";
import { createExecuteTool } from "@bio-mcp/shared/codemode/execute-tool";
import { monarchCatalog } from "../spec/catalog";
import { createMonarchApiFetch } from "../lib/api-adapter";

interface CodeModeEnv {
    MONARCH_DATA_DO: DurableObjectNamespace;
    CODE_MODE_LOADER: WorkerLoader;
}

export function registerCodeMode(
    server: McpServer,
    env: CodeModeEnv,
): void {
    const apiFetch = createMonarchApiFetch();

    const searchTool = createSearchTool({
        prefix: "monarch",
        catalog: monarchCatalog,
    });
    searchTool.register(server as unknown as { tool: (...args: unknown[]) => void });

    const executeTool = createExecuteTool({
        prefix: "monarch",
        catalog: monarchCatalog,
        apiFetch,
        doNamespace: env.MONARCH_DATA_DO,
        loader: env.CODE_MODE_LOADER,
    });
    executeTool.register(server as unknown as { tool: (...args: unknown[]) => void });
}
