import * as vscode from "vscode";
import { provider } from "../../../src/core/provider";

export async function callProviderDirectly(
  doc: vscode.TextDocument
): Promise<vscode.TextEdit[] | undefined> {

  const token = new vscode.CancellationTokenSource().token;

  const formattingOptions: vscode.FormattingOptions = {
    insertSpaces: true,
    tabSize: 2
  };

  const result = await provider.provideDocumentFormattingEdits(
    doc,
    formattingOptions,
    token
  );

  // Normalize VS Code's ProviderResult<T> to your expected type
  return result ?? undefined;
}