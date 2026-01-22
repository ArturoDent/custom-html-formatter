import * as vscode from "vscode";

export async function waitForFormatterPresence(
  uri: vscode.Uri,
  shouldExist: boolean,
  timeoutMs = 2000
): Promise<void> {
  const start = Date.now();

  while ( Date.now() - start < timeoutMs ) {
    const edits = await vscode.commands.executeCommand<
      vscode.TextEdit[] | undefined
    >(
      "vscode.executeFormatDocumentProvider",
      uri
    );

    if ( shouldExist ? edits !== undefined : edits === undefined ) {
      return;
    }

    await new Promise( r => setTimeout( r, 50 ) );
  }

  throw new Error(
    `Timed out waiting for formatter to ${shouldExist ? "register" : "unregister"}`
  );
}
