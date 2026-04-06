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

export function printSuccess(msg: string): void {
  process.stderr.write(`${msg}\n`);
}
