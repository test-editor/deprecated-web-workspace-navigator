import { DebugElement } from '@angular/core';
import { Response, ResponseOptions } from '@angular/http';
import { By } from '@angular/platform-browser';
import { async, TestBed, ComponentFixture } from '@angular/core/testing';
import { mock, instance, verify, when, anyString } from 'ts-mockito';
import { MessagingService } from '@testeditor/messaging-service';
import { testBedSetup } from './tree-viewer.component.spec';

import { ElementType } from '../../common/element-type';
import { WorkspaceElement } from '../../common/workspace-element';
import { PersistenceService } from '../../service/persistence/persistence.service';
import { NewElementComponent } from './new-element.component';
import { UiState } from '../ui-state';
import * as events from '../event-types';

describe('NewElementComponent', () => {

  let fixture: ComponentFixture<NewElementComponent>;
  let component: NewElementComponent;
  let input: DebugElement;
  let messagingService: MessagingService;
  let persistenceService: PersistenceService;

  let requestWithDummySelected = {
    selectedElement: {
      name: "dummy.txt",
      path: "some/path/dummy.txt",
      type: ElementType.File,
      children: [] as WorkspaceElement[]
    },
    type: ElementType.File
  };

  beforeEach(async(() => {
    persistenceService = mock(PersistenceService);
    testBedSetup([
      { provide: PersistenceService, useValue: instance(persistenceService) }
    ]);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewElementComponent);
    component = fixture.componentInstance;
    component.uiState = new UiState();
    component.uiState.newElementRequest = { selectedElement: null, type: ElementType.Folder }
    input = fixture.debugElement.query(By.css("input"));
    messagingService = TestBed.get(MessagingService);
  });

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
    expect(component.uiState.newElementRequest).toBeFalsy();
  });

  it('removes itself when escape is pressed', () => {
    // when
    input.triggerEventHandler('keyup.escape', {});

    // then
    expect(component.uiState.newElementRequest).toBeFalsy();
  });

  it('adds padding when nothing is selected', () => {
    // when + then
    expect(component.getPaddingLeft()).toEqual("12px");
  });

  it('does not add padding-left when a file is selected', () => {
    // given
    component.uiState.newElementRequest = requestWithDummySelected;

    // when + then
    expect(component.getPaddingLeft()).toEqual("0px");
  });

  it('calls createDocument when enter is pressed', () => {
    // given
    input.nativeElement.value = "something-new.txt";

    // when
    input.triggerEventHandler('keyup.enter', {});

    // then
    verify(persistenceService.createDocument("something-new.txt")).once();
  });

  it('calls createDocument with the proper too path when enter is pressed', () => {
    // given
    input.nativeElement.value = "something-new.txt";
    component.uiState.newElementRequest = requestWithDummySelected;

    // when
    input.triggerEventHandler('keyup.enter', {});

    // then
    verify(persistenceService.createDocument("some/path/something-new.txt")).once();
  });

  it('removes itself and emits navigation.refresh event when createDocument returns', () => {
    // given
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_REFRESH, callback);
    let response: Response = new Response(new ResponseOptions({
      body: "",
      status: 200,
      headers: null,
      url: null
    }));
    when(persistenceService.createDocument(anyString())).thenReturn(Promise.resolve(response));

    // when
    input.triggerEventHandler('keyup.enter', {});

    // then
    fixture.whenStable().then(() => {
      expect(callback).toHaveBeenCalledTimes(1);
      expect(component.uiState.newElementRequest).toBeFalsy();
    });
  });

});
