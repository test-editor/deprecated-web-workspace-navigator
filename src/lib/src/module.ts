import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';

import { NavigationComponent } from './component/navigation/navigation.component';
import { TreeViewerComponent } from './component/tree-viewer/tree-viewer.component';

import { WorkspaceService } from './service/workspace/workspace.service';

import { LibComponent } from './component/lib.component';
import { LibService } from './service/lib.service';

@NgModule({
  imports: [
    CommonModule,
    HttpModule
  ],
  declarations: [
    NavigationComponent,
    TreeViewerComponent,
    LibComponent
  ],
  providers: [
    WorkspaceService,
    LibService
  ],
  exports: [
    NavigationComponent,
    TreeViewerComponent,
    LibComponent
  ]
})
export class LibModule { }