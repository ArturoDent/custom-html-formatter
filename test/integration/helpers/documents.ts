import * as vscode from "vscode";
import * as path from "path";

export async function openFixtureDocument( relPath: string ) {
  const absolute = path.resolve( __dirname, "../fixtures", relPath );
  const uri = vscode.Uri.file( absolute );
  return await vscode.workspace.openTextDocument( uri );
}