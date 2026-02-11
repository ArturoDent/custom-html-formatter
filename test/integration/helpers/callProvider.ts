import * as vscode from "vscode";
import { provider } from "../../../src/core/provider";
import { getCurrentConfigs } from '../../../src/state/formatterState';


export async function callProviderDirectly(
  doc: vscode.TextDocument
): Promise<vscode.TextEdit[] | undefined> {

  const token = new vscode.CancellationTokenSource().token;
  const rules = getCurrentConfigs()?.rules;

  const formattingOptions: vscode.FormattingOptions = {
    insertSpaces: true,
    tabSize: rules?.indentSize ?? 2
  };

  const result = await provider.provideDocumentFormattingEdits(
    doc,
    formattingOptions,
    token
  );

  // Normalize VS Code's ProviderResult<T> to your expected type
  return result ?? undefined;
}