import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { async, TestBed, ComponentFixture } from '@angular/core/testing';
import { mock, instance, verify, when, anyString } from 'ts-mockito';
import { MessagingService } from '@testeditor/messaging-service';
import { testBedSetup } from './tree-viewer.component.spec';

import { ElementType } from '../../common/element-type';
import { WorkspaceElement } from '../../common/workspace-element';
import { PathValidator } from './path-validator';
import { PersistenceService } from '../../service/persistence/persistence.service';
import { NewElementComponent } from './new-element.component';
import { UiState } from '../ui-state';
import * as events from '../event-types';
import { Workspace } from '../../common/workspace';

describe('NewElementComponent', () => {

  let fixture: ComponentFixture<NewElementComponent>;
  let component: NewElementComponent;
  let input: DebugElement;
  let messagingService: MessagingService;
  let persistenceService: PersistenceService;

  let requestWithDummySelected = {
    selectedElement: {
      name: 'dummy.txt',
      path: 'some/path/dummy.txt',
      type: ElementType.File,
      children: [] as WorkspaceElement[]
    },
    type: ElementType.File
  };

  beforeEach(async(() => {
    persistenceService = mock(PersistenceService);
    testBedSetup([
      PathValidator,
      { provide: PersistenceService, useValue: instance(persistenceService) }
    ]);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewElementComponent);
    component = fixture.componentInstance;
    component.workspace = new Workspace();
    component.workspace.setSelected(null);
    component.workspace.newElement(ElementType.Folder);
    input = fixture.debugElement.query(By.css('input'));
    messagingService = TestBed.get(MessagingService);
  });

  /**
   * Emulates jQuery's implementation
   * https://makandracards.com/makandra/1339-check-whether-an-element-is-visible-or-hidden-with-javascript
   */
  function isVisible(element: DebugElement): boolean {
    return element.nativeElement.offsetWidth > 0 && element.nativeElement.offsetHeight > 0;
  }

  it('focuses on the input after view initialized', () => {
    // given
    let focusSpy = spyOn(input.nativeElement, 'focus');

    // when
    component.ngAfterViewInit();

    // then
    expect(focusSpy).toHaveBeenCalled();
  });

  it('removes itself when focus is lost', () => {
    // when
    input.triggerEventHandler('blur', {});

    // then
    expect(component.workspace.hasNewElementRequest()).toBeFalsy();
  });

  it('removes itself when escape is pressed', () => {
    // when
    input.triggerEventHandler('keyup.escape', {});

    // then
    expect(component.workspace.hasNewElementRequest()).toBeFalsy();
  });

  it('adds padding when nothing is selected', () => {
    // when + then
    expect(component.getPaddingLeft()).toEqual('12px');
  });

  it('does not add padding-left when a file is selected', () => {
    // given
    component.workspace.reload(requestWithDummySelected.selectedElement);
    component.workspace.setSelected(requestWithDummySelected.selectedElement.path);
    component.workspace.newElement(requestWithDummySelected.type);

    // when + then
    expect(component.getPaddingLeft()).toEqual('0px');
  });

  it('hides error message by default', () => {
    // given
    expect(component.errorMessage).toBeFalsy();

    // when
    fixture.detectChanges();

    // then
    let alert = fixture.debugElement.query(By.css('.alert'));
    expect(isVisible(alert)).toBeFalsy();
    expect(input.classes['input-error']).toBeFalsy();
  });

  it('displays error message when set', () => {
    // given
    component.errorMessage = 'the error message to show';

    // when
    fixture.detectChanges();

    // then
    let alert = fixture.debugElement.query(By.css('.alert'));
    expect(isVisible(alert)).toBeTruthy();
    expect(alert.nativeElement.textContent).toBe('the error message to show');
    expect(input.classes['input-error']).toBeTruthy();
  });

  it('calls createDocument with type file when enter is pressed', () => {
    // given
    component.workspace.newElement(ElementType.File);
    input.nativeElement.value = 'something-new.txt';

    // when
    input.triggerEventHandler('keyup.enter', {});

    // then
    verify(persistenceService.createResource('something-new.txt', 'file')).once();
  });

  it('calls createDocument with type folder when enter is pressed', () => {
    // given
    component.workspace.newElement(ElementType.Folder);
    input.nativeElement.value = 'newFolder';

    // when
    input.triggerEventHandler('keyup.enter', {});

    // then
    verify(persistenceService.createResource('newFolder', ElementType.Folder)).once();
  });

  it('calls createDocument with the proper path when enter is pressed', () => {
    // given
    input.nativeElement.value = 'something-new.txt';
    component.workspace.reload(requestWithDummySelected.selectedElement);
    component.workspace.setSelected(requestWithDummySelected.selectedElement.path);
    component.workspace.newElement(requestWithDummySelected.type);

    // when
    input.triggerEventHandler('keyup.enter', {});

    // then
    verify(persistenceService.createResource('some/path/something-new.txt', ElementType.File)).once();
  });

  it('removes itself and emits navigation.created event when createDocument returns', async(() => {
    // given
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_CREATED, callback);
    when(persistenceService.createResource(anyString(), anyString())).thenReturn(Promise.resolve('some/path'));

    // when
    component.onEnter();

    // then
    fixture.whenStable().then(() => {
      expect(callback).toHaveBeenCalledTimes(1);
      let expectedPayload = jasmine.objectContaining({ path: 'some/path' });
      expect(callback).toHaveBeenCalledWith(expectedPayload);
      expect(component.workspace.hasNewElementRequest()).toBeFalsy();
    });
  }));

  it('signals an error when createDocument failed', async(() => {
    // given
    when(persistenceService.createResource(anyString(), anyString())).thenReturn(Promise.reject('failed'));

    // when
    component.onEnter();

    // then
    fixture.whenStable().then(() => {
      fixture.whenStable().then(() => {
        expect(component.errorMessage).toBeTruthy();
      });
    });
  }));

  it('shows file icon when a new file should be created', () => {
    // given
    component.workspace.newElement(ElementType.File);

    // when
    fixture.detectChanges();

    // then
    let iconType = fixture.debugElement.query(By.css('.icon-type'));
    expect(iconType.classes['fa-file']).toBeTruthy();
  });

  it('shows folder icon when a new folder should be created', () => {
    // given
    component.workspace.newElement(ElementType.Folder);

    // when
    fixture.detectChanges();

    // then
    let iconType = fixture.debugElement.query(By.css('.icon-type'));
    expect(iconType.classes['fa-folder']).toBeTruthy();
  });

  it('validation for valid input does not show error message', () => {
    // given
    input.nativeElement.value = 'valid.txt';

    // when
    input.triggerEventHandler('keyup.enter', {});
    fixture.detectChanges();

    // then
    expect(component.errorMessage).toBeFalsy();
  });

  it('validation for invalid input shows error message', () => {
    // given
    input.nativeElement.value = '../invalid.txt';

    // when
    input.triggerEventHandler('keyup.enter', {});
    fixture.detectChanges();

    // then
    let alert = fixture.debugElement.query(By.css('.alert'));
    expect(isVisible(alert)).toBeTruthy();
    expect(alert.nativeElement.textContent.trim()).toBe('Relative path segments such as "../" are not allowed.');
  });

  it('does not call anything on invalid input when enter is pressed', () => {
    // given
    input.nativeElement.value = '../invalid.txt';
    component.workspace.reload(requestWithDummySelected.selectedElement);
    component.workspace.setSelected(requestWithDummySelected.selectedElement.path);
    component.workspace.newElement(requestWithDummySelected.type);

    // when
    input.triggerEventHandler('keyup.enter', {});

    // then
    verify(persistenceService.createResource(anyString(), anyString())).never();
  });

});
