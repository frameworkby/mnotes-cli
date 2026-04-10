"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printJson = printJson;
exports.printNoteList = printNoteList;
exports.printNote = printNote;
exports.printSearchResults = printSearchResults;
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
function printSuccess(msg) {
    process.stderr.write(`${msg}\n`);
}
