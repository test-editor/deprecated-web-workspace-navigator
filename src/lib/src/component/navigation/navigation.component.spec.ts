import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { HttpModule } from '@angular/http';
import { By } from '@angular/platform-browser';
import { MessagingModule } from '@testeditor/messaging-service';

import { PersistenceService } from '../../service/persistence/persistence.service';
import { PersistenceServiceConfig } from '../../service/persistence/persistence.service.config';
import { TreeViewerComponent } from '../tree-viewer/tree-viewer.component';
import { NavigationComponent } from './navigation.component';
import { WorkspaceElement} from '../../service/persistence/workspace-element';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let persistenceService : PersistenceService;
  let spy : jasmine.Spy;
  let listedFiles : WorkspaceElement;
  let sidenav : DebugElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        NavigationComponent,
        TreeViewerComponent
      ],
      imports: [
        HttpModule,
        MessagingModule.forRoot()
      ],
      providers: [
        PersistenceService,
        {
          provide: PersistenceServiceConfig,
          useValue: {
            serviceUrl: "http://localhost:9080",
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
    persistenceService = fixture.debugElement.injector.get(PersistenceService);
    spy = spyOn(persistenceService, 'listFiles')
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
