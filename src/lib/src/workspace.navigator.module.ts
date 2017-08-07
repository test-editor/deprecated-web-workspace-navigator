import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';

import { NavigationComponent } from './component/navigation/navigation.component';
import { TreeViewerComponent } from './component/tree-viewer/tree-viewer.component';

import { PersistenceService } from './service/persistence/persistence.service';
import { PersistenceServiceConfig } from './service/persistence/persistence.service.config';

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
    LibService
  ],
  exports: [
    NavigationComponent,
    TreeViewerComponent,
    LibComponent
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