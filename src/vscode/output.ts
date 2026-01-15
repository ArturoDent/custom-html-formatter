import * as vscode from "vscode";

let dryRunChannel: vscode.OutputChannel | undefined;
let healthOutputChannel: vscode.OutputChannel | undefined;


export function getDryRunChannel(): vscode.OutputChannel {
  if ( !dryRunChannel ) {
    dryRunChannel = vscode.window.createOutputChannel(
      "Custom HTML Formatter — Dry Run"
    );
  }
  return dryRunChannel;
}

export function getHealthOutputChannel(): vscode.OutputChannel {
  if ( !healthOutputChannel ) {
    healthOutputChannel = vscode.window.createOutputChannel(
      "Custom HTML Formatter — Dry Run"
    );
  }
  return healthOutputChannel;
}
