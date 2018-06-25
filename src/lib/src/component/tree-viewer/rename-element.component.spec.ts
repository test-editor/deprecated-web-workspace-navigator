import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { async, TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { capture, anyFunction, mock, instance, verify, when, anyString } from 'ts-mockito';
import { MessagingService } from '@testeditor/messaging-service';
import { testBedSetup } from './tree-viewer.component.spec';

import { ElementType } from '../../common/element-type';
import { WorkspaceElement } from '../../common/workspace-element';
import { PathValidator } from './path-validator';
import { PersistenceService } from '../../service/persistence/persistence.service';
import { RenameElementComponent } from './rename-element.component';
import { UiState } from '../ui-state';
import * as events from '../event-types';
import { Workspace } from '../../common/workspace';
import { Conflict } from '../../service/persistence/conflict';

describe('RenameElementComponent', () => {

  let fixture: ComponentFixture<RenameElementComponent>;
  let component: RenameElementComponent;
  let input: DebugElement;
  let messagingService: MessagingService;
  let persistenceService: PersistenceService;

  let renameRequestWithDummySelected = {
    selectedElement: {
      name: 'dummy.txt',
      path: 'some/path/dummy.txt',
      type: ElementType.File,
      children: [] as WorkspaceElement[]
    }
  };

  beforeEach(async(() => {
    persistenceService = mock(PersistenceService);
    testBedSetup([
      PathValidator,
      { provide: PersistenceService, useValue: instance(persistenceService) }
    ]);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RenameElementComponent);
    component = fixture.componentInstance;
    component.workspace = new Workspace();
    component.workspace.setSelected(null);
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

  /**
   * prepare tree and selection to know 'Dummy' and start renameElement
   */
  function selectDummyAndStartRenameOnIt(): void {
    component.workspace.reload(renameRequestWithDummySelected.selectedElement);
    component.workspace.setSelected(renameRequestWithDummySelected.selectedElement.path);
    component.workspace.renameElement(renameRequestWithDummySelected.selectedElement);
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
    expect(component.workspace.hasRenameElementRequest()).toBeFalsy();
  });

  it('removes itself when escape is pressed', () => {
    // when
    input.triggerEventHandler('keyup.escape', {});

    // then
    expect(component.workspace.hasRenameElementRequest()).toBeFalsy();
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

  it('produces error message when renaming dirty files', () => {
    // given
    selectDummyAndStartRenameOnIt();
    component.workspace.setDirty(component.workspace.getRenameElement().path, true);

    // when
    component.validate();

    // then
    expect(component.errorMessage).toEqual('cannot rename dirty files');
  });

  it('calls renameDocument with the proper path when enter is pressed', () => {
    // given
    selectDummyAndStartRenameOnIt();
    input.nativeElement.value = 'rename.txt';

    // when
    input.triggerEventHandler('keyup.enter', {});

    // then
    verify(persistenceService.renameResource('some/path/rename.txt', 'some/path/dummy.txt', anyFunction(), anyFunction())).once();
  });

  it('removes itself and emits navigation.renamed event when renameDocument returns', fakeAsync(() => {
    // given
    selectDummyAndStartRenameOnIt();
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_RENAMED, callback);
    component.input.nativeElement.value = 'rename.txt'

    // when
    component.onEnter();

    // and given that
    const [path, typeString, onSuccess, onError] = capture(persistenceService.renameResource).last();
    onSuccess('some/path/rename.txt')

    tick();

    // then
    expect(callback).toHaveBeenCalledTimes(1);
    let expectedPayload = jasmine.objectContaining({ newPath: 'some/path/rename.txt', oldPath: 'some/path/dummy.txt' });
    expect(callback).toHaveBeenCalledWith(expectedPayload);
    expect(component.workspace.hasRenameElementRequest()).toBeFalsy();
  }));

  it('signals an error when renameDocument failed', fakeAsync(() => {
    // given
    selectDummyAndStartRenameOnIt();

    // when
    component.onEnter();

    // and given that
    const [path, typeString, onSuccess, onError] = capture(persistenceService.renameResource).last();
    onError('failed');

    tick();

    // then
    expect(component.errorMessage).toBeTruthy();
  }));

  it('displays error and refreshes workspace when renameDocument returns with a conflict', fakeAsync(() => {
    // given
    selectDummyAndStartRenameOnIt();
    const conflict = new Conflict(`The file 'something-new.txt' already exists.`)
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_RENAMED, callback);
    component.input.nativeElement.value = 'fileThatAlreadyExists'

    // when
    component.onEnter();

    // and given
    const [name, path, onResponse, onError] = capture(persistenceService.renameResource).last();
    onResponse(conflict);

    tick();

    // then
    expect(callback).toHaveBeenCalledTimes(1);
    let expectedPayload = jasmine.objectContaining({ newPath: 'some/path/dummy.txt', oldPath: 'some/path/dummy.txt' });
    expect(callback).toHaveBeenCalledWith(expectedPayload);
    expect(component.errorMessage).toEqual(conflict.message);
    expect(component.input.nativeElement.value).toEqual('');
  }));

  it('validation for valid input does not show error message', () => {
    // given
    selectDummyAndStartRenameOnIt();
    input.nativeElement.value = 'valid.txt';

    // when
    input.triggerEventHandler('keyup.enter', {});
    fixture.detectChanges();

    // then
    expect(component.errorMessage).toBeFalsy();
  });

  it('validation for invalid input shows error message', () => {
    // given
    selectDummyAndStartRenameOnIt();
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
    selectDummyAndStartRenameOnIt();
    input.nativeElement.value = '../invalid.txt';

    // when
    input.triggerEventHandler('keyup.enter', {});

    // then
    verify(persistenceService.renameResource(anyString(), anyString(), anyFunction(), anyFunction())).never();
  });

});
