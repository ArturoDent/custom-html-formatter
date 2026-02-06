import * as vscode from "vscode";

export async function openWorkspaceFolder( name: string ) {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if ( !folder ) throw new Error( "No workspace folder open" );
  return folder;
}