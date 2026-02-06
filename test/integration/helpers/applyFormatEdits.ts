import * as vscode from "vscode";

/**
 * Run the VS Code formatting pipeline for the given document and apply any edits returned.
 * Returns the array of edits that were applied (empty array if none).
 */
export async function applyFormatEdits(
  doc: vscode.TextDocument
): Promise<vscode.TextEdit[]> {
  // Ask VS Code for formatting edits (may return null | undefined)
  const result = await vscode.commands.executeCommand<vscode.TextEdit[] | null | undefined>(
    "vscode.executeFormatDocumentProvider",
    doc.uri
  );

  // Normalize null/undefined to an empty array
  const edits = result ?? [];

  if ( edits.length === 0 ) {
    return edits;
  }

  // Apply edits to the workspace
  const wsEdit = new vscode.WorkspaceEdit();
  wsEdit.set( doc.uri, edits );
  await vscode.workspace.applyEdit( wsEdit );

  // Ensure the document is up to date before returning
  // (openTextDocument returns the same doc instance; getText will reflect applied edits)
  return edits;
}