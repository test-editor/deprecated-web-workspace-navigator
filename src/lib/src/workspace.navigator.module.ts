import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { NavigationComponent } from './component/navigation/navigation.component';
import { TreeViewerComponent } from './component/tree-viewer/tree-viewer.component';

import { PersistenceService } from './service/persistence/persistence.service';
import { PersistenceServiceConfig } from './service/persistence/persistence.service.config';
import { NewElementComponent } from './component/tree-viewer/new-element.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpModule
  ],
  declarations: [
    NavigationComponent,
    TreeViewerComponent,
    NewElementComponent
  ],
  exports: [
    NavigationComponent,
    TreeViewerComponent
  ]
})
export class WorkspaceNavigatorModule {

  static forRoot(config: PersistenceServiceConfig): ModuleWithProviders {
    return {
      ngModule: WorkspaceNavigatorModule,
      providers: [
        { provide: PersistenceServiceConfig, useValue: config },
        PersistenceService
      ]
    };
  }

}
