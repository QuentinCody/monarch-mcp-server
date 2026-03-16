import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = join(__dirname, "..");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

let total = 0;
let passed = 0;
let failed = 0;

function assert(condition, message) {
    total++;
    if (condition) {
        passed++;
        console.log(`  ${GREEN}✓${RESET} ${message}`);
    } else {
        failed++;
        console.log(`  ${RED}✗${RESET} ${message}`);
    }
}

function readSrc(relPath) {
    return readFileSync(join(serverDir, relPath), "utf-8");
}

console.log(`\n${BLUE}Monarch MCP Server — Structured Content Regression${RESET}\n`);

const assocSearch = readSrc("src/tools/association-search.ts");
assert(assocSearch.includes("createCodeModeResponse"), "association-search.ts includes createCodeModeResponse");
assert(assocSearch.includes("createCodeModeError"), "association-search.ts includes createCodeModeError");

const entityLookup = readSrc("src/tools/entity-lookup.ts");
assert(entityLookup.includes("createCodeModeResponse"), "entity-lookup.ts includes createCodeModeResponse");
assert(entityLookup.includes("createCodeModeError"), "entity-lookup.ts includes createCodeModeError");

const phenoSim = readSrc("src/tools/phenotype-similarity.ts");
assert(phenoSim.includes("createCodeModeResponse"), "phenotype-similarity.ts includes createCodeModeResponse");
assert(phenoSim.includes("createCodeModeError"), "phenotype-similarity.ts includes createCodeModeError");

const index = readSrc("src/index.ts");
assert(index.includes("MonarchDataDO"), "index.ts exports MonarchDataDO");
assert(index.includes("McpAgent"), "index.ts uses McpAgent");

console.log(`\n  Total: ${total} | ${GREEN}Passed: ${passed}${RESET} | ${failed > 0 ? RED : ""}Failed: ${failed}${RESET}\n`);

if (failed > 0) process.exit(1);
