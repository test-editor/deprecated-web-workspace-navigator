import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { HttpModule } from '@angular/http';
import { By } from '@angular/platform-browser';
import { MessagingModule } from '@testeditor/messaging-service';
import { mock, when, anyOfClass, instance } from 'ts-mockito';

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
  let sidenav : DebugElement;

  beforeEach(async(() => {
    // Mock PersistenceService
    let listedFiles: WorkspaceElement = {
      name: "file.tcl",
      path: "path/to/file.tcl",
      expanded: true,
      type: "file",
      children: []
    };
    persistenceService = mock(PersistenceService);
    when(persistenceService.listFiles()).thenReturn(Promise.resolve(listedFiles));

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
        { provide: PersistenceService, useValue: instance(persistenceService) }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    sidenav = fixture.debugElement.query(By.css('.sidenav'));
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('workspaceRoot is set initially', () => {
    fixture.whenStable().then(() => {
      expect(component.workspaceRoot.name).toEqual("file.tcl");
    });
  });

});
