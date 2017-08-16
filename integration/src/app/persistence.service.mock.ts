import { Injectable } from '@angular/core';
import { WorkspaceElement } from '@testeditor/workspace-navigator';

@Injectable()
export class PersistenceServiceMock {

  readonly data: WorkspaceElement = {
    name: "root",
    path: "",
    expanded: true,
    type: "folder",
    children: [
      {
        name: "hello.tsl",
        path: "hello.tsl",
        expanded: false,
        type: "file",
        children: []
      },
      {
        name: "world.tsl",
        path: "world.tsl",
        expanded: false,
        type: "file",
        children: []
      },
      {
        name: "com",
        path: "com",
        expanded: true,
        type: "folder",
        children: [
          {
            name: "example",
            path: "com/example",
            expanded: true,
            type: "folder",
            children: [
              {
                name: "test.tsl",
                path: "com/example/test.tsl",
                expanded: true,
                type: "file",
                children: []
              }
            ]
          }
        ]
      }
    ]
  }

  listFiles(): Promise<WorkspaceElement> {
    return Promise.resolve(this.data);
  }

}
