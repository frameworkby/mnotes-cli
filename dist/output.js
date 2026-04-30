"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printJson = printJson;
exports.printNoteList = printNoteList;
exports.printNote = printNote;
exports.printSearchResults = printSearchResults;
exports.printKnowledgeResults = printKnowledgeResults;
exports.printGraph = printGraph;
exports.printSuccess = printSuccess;
function printJson(data) {
    console.log(JSON.stringify(data, null, 2));
}
function printNoteList(notes) {
    if (notes.length === 0) {
        process.stderr.write("No notes found.\n");
        return;
    }
    // Header
    const idWidth = Math.max(4, ...notes.map((n) => n.id.length));
    const titleWidth = Math.max(5, ...notes.map((n) => n.title.length));
    console.log(`${"ID".padEnd(idWidth)}  ${"TITLE".padEnd(titleWidth)}  UPDATED`);
    for (const note of notes) {
        const updated = new Date(note.updatedAt).toLocaleDateString();
        console.log(`${note.id.padEnd(idWidth)}  ${note.title.padEnd(titleWidth)}  ${updated}`);
    }
}
function printNote(note) {
    console.log(note.title);
    console.log("");
    if (note.content) {
        console.log(note.content);
    }
}
function printSearchResults(results) {
    if (results.length === 0) {
        process.stderr.write("No results found.\n");
        return;
    }
    for (let i = 0; i < results.length; i++) {
        const r = results[i];
        console.log(`${i + 1}. [${r.id}] ${r.title}`);
        if (r.snippet) {
            console.log(`   ${r.snippet}`);
        }
    }
}
function printKnowledgeResults(results) {
    if (results.length === 0) {
        process.stderr.write("No knowledge entries found.\n");
        return;
    }
    for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const score = (r.finalScore * 100).toFixed(0);
        const key = r.key ? ` [${r.key}]` : "";
        const tags = r.tags.length > 0 ? ` (${r.tags.join(", ")})` : "";
        const importance = r.importance !== null ? ` imp:${r.importance}` : "";
        console.log(`${i + 1}. ${r.title}${key}  ${score}%${importance}${tags}`);
        if (r.excerpt) {
            const lines = r.excerpt.split("\n").slice(0, 3).join("\n   ");
            console.log(`   ${lines}`);
        }
        if (i < results.length - 1)
            console.log("");
    }
    console.log("");
    console.log(`${results.length} result(s)`);
}
function printGraph(nodes, edges) {
    if (nodes.length === 0) {
        process.stderr.write("Knowledge graph is empty.\n");
        return;
    }
    const idWidth = Math.max(4, ...nodes.map((n) => n.id.length));
    const typeWidth = Math.max(4, ...nodes.map((n) => n.nodeType.length));
    const labelWidth = Math.min(50, Math.max(5, ...nodes.map((n) => n.label.length)));
    console.log(`${"ID".padEnd(idWidth)}  ${"TYPE".padEnd(typeWidth)}  LABEL`);
    for (const node of nodes) {
        const label = node.label.length > labelWidth
            ? node.label.substring(0, labelWidth - 1) + "…"
            : node.label;
        const depthSuffix = node.depth !== undefined && node.depth > 0 ? `  (depth ${node.depth})` : "";
        console.log(`${node.id.padEnd(idWidth)}  ${node.nodeType.padEnd(typeWidth)}  ${label}${depthSuffix}`);
    }
    if (edges.length > 0) {
        console.log("");
        console.log(`Edges (${edges.length}):`);
        for (const edge of edges) {
            const srcLabel = nodes.find((n) => n.id === edge.sourceId)?.label ?? edge.sourceId;
            const tgtLabel = nodes.find((n) => n.id === edge.targetId)?.label ?? edge.targetId;
            console.log(`  ${srcLabel} --[${edge.edgeType}]--> ${tgtLabel}`);
        }
    }
    console.log("");
    console.log(`${nodes.length} node(s), ${edges.length} edge(s)`);
}
function printSuccess(msg) {
    process.stderr.write(`${msg}\n`);
}
