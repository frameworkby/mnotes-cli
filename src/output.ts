export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printNoteList(
  notes: Array<{ id: string; title: string; updatedAt: string }>
): void {
  if (notes.length === 0) {
    process.stderr.write("No notes found.\n");
    return;
  }

  // Header
  const idWidth = Math.max(4, ...notes.map((n) => n.id.length));
  const titleWidth = Math.max(5, ...notes.map((n) => n.title.length));

  console.log(
    `${"ID".padEnd(idWidth)}  ${"TITLE".padEnd(titleWidth)}  UPDATED`
  );
  for (const note of notes) {
    const updated = new Date(note.updatedAt).toLocaleDateString();
    console.log(
      `${note.id.padEnd(idWidth)}  ${note.title.padEnd(titleWidth)}  ${updated}`
    );
  }
}

export function printNote(note: {
  id: string;
  title: string;
  content: string | null;
}): void {
  console.log(note.title);
  console.log("");
  if (note.content) {
    console.log(note.content);
  }
}

export function printSearchResults(
  results: Array<{ id: string; title: string; snippet?: string }>
): void {
  if (results.length === 0) {
    process.stderr.write("No results found.\n");
    return;
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i]!;
    console.log(`${i + 1}. [${r.id}] ${r.title}`);
    if (r.snippet) {
      console.log(`   ${r.snippet}`);
    }
  }
}

export function printGraph(
  nodes: Array<{ id: string; noteId: string | null; label: string; nodeType: string; depth?: number }>,
  edges: Array<{ id: string; sourceId: string; targetId: string; edgeType: string; weight: number }>,
): void {
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

export function printSuccess(msg: string): void {
  process.stderr.write(`${msg}\n`);
}
