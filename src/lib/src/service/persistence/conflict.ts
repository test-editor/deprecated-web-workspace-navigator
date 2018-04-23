// TODO remove this file (which was copied over from test-editor-web) and refactor its usages out into test-editor-web

export class Conflict {
  constructor(readonly message: string, readonly backupFilePath?: string) { }
}

export function isConflict(conflict: Conflict | string): conflict is Conflict {
  return (<Conflict>conflict).message !== undefined;
}
