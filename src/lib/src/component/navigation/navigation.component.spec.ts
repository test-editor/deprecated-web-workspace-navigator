import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { HttpModule } from '@angular/http';
import { By } from '@angular/platform-browser';

import { WorkspaceService } from '../../service/workspace/workspace.service';
import { WorkspaceServiceConfig } from '../../service/workspace/workspace-service-config';
import { TreeViewerComponent } from '../tree-viewer/tree-viewer.component';
import { NavigationComponent } from './navigation.component';
import { WorkspaceElement} from '../../service/workspace/workspace-element';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let workspaceService : WorkspaceService;
  let spy : jasmine.Spy;
  let listedFiles : WorkspaceElement;
  let sidenav : DebugElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        NavigationComponent,
        TreeViewerComponent
      ],
      imports: [ HttpModule ],
      providers: [
        WorkspaceService,
        {
          provide: WorkspaceServiceConfig,
          useValue: {
            serviceUrl: "http://localhost:9080/workspace",
            authorizationHeader: "admin:admin@example.com"
        }
      }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    listedFiles = {
      name: "file.tcl",
      path: "path/to/file.tcl",
      expanded: true,
      type: "file",
      children: []
    };
    fixture.detectChanges();
    workspaceService = fixture.debugElement.injector.get(WorkspaceService);
    spy = spyOn(workspaceService, 'listFiles')
      .and.returnValue(Promise.resolve(listedFiles));
    sidenav = fixture.debugElement.query(By.css('.sidenav'));
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('workspaceRoot is set through list files', () => {
    fixture.detectChanges();

    fixture.whenStable().then(() => { // wait for async actions
      fixture.detectChanges();        // update view with listed files
      expect(component.workspaceRoot.name).toEqual("file.tcl");
    });
  });

});
