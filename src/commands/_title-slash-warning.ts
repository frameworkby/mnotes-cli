export function maybeWarnTitleSlash(title: string, hasFolder: boolean): void {
  if (!title.includes("/") || hasFolder) return;
  const suppress = process.env.MNOTES_SUPPRESS_TITLE_SLASH_WARNING;
  if (suppress === "1" || suppress === "true") return;
  process.stderr.write(
    "Tip: title contains '/'; did you mean to use --folder? " +
      "(set MNOTES_SUPPRESS_TITLE_SLASH_WARNING=1 to silence)\n",
  );
}
