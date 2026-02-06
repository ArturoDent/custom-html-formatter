import * as vscode from "vscode";

// export async function formatDocument( doc: vscode.TextDocument ) {
//   const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
//     "vscode.executeFormatDocumentProvider",
//     doc.uri
//   );
//   const wsEdit = new vscode.WorkspaceEdit();
//   wsEdit.set( doc.uri, edits ?? [] );
//   await vscode.workspace.applyEdit( wsEdit );
// }

export async function getProviderEdits( doc: vscode.TextDocument ) {
  return vscode.commands.executeCommand<vscode.TextEdit[] | undefined>(
    "vscode.executeFormatDocumentProvider",
    doc.uri
  );
}