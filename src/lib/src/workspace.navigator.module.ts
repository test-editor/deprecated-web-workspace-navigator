import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { NavigationComponent } from './component/navigation/navigation.component';
import { TreeViewerComponent } from './component/tree-viewer/tree-viewer.component';

import { PathValidator } from './component/tree-viewer/path-validator';
import { PersistenceService } from './service/persistence/persistence.service';
import { PersistenceServiceConfig } from './service/persistence/persistence.service.config';
import { NewElementComponent } from './component/tree-viewer/new-element.component';
import { DefaultTestExecutionService } from './service/execution/test.execution.service';
import { TestExecutionServiceConfig } from './service/execution/test.execution.service.config';
import { WindowService } from './service/browserObjectModel/window.service';
import { DefaultWindowService } from './service/browserObjectModel/default.window.service';
import { IndicatorBoxComponent } from './component/tree-viewer/indicator.box.component';
import { IndicatorFieldSetup } from './common/markers/field';
import { HttpClientModule } from '@angular/common/http/src/module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
    // HttpClientModule
  ],
  declarations: [
    NavigationComponent,
    TreeViewerComponent,
    NewElementComponent,
    IndicatorBoxComponent
  ],
  exports: [
    NavigationComponent,
    TreeViewerComponent
  ]
})
export class WorkspaceNavigatorModule {

  static forRoot(persistanceConfig: PersistenceServiceConfig,
                 testExecutionConfig: TestExecutionServiceConfig,
                 indicatorFieldSetup: IndicatorFieldSetup): ModuleWithProviders {
    return {
      ngModule: WorkspaceNavigatorModule,
      providers: [
        { provide: PersistenceServiceConfig, useValue: persistanceConfig },
        { provide: TestExecutionServiceConfig, useValue: testExecutionConfig },
        { provide: WindowService, useClass: DefaultWindowService },
        { provide: IndicatorFieldSetup, useValue: indicatorFieldSetup },
        PathValidator,
        PersistenceService,
        DefaultTestExecutionService
      ]
    };
  }

}
