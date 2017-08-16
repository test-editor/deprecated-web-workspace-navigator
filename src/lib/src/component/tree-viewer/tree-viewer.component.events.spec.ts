import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { MessagingService } from '@testeditor/messaging-service';

import { TreeViewerComponent } from './tree-viewer.component';
import { WorkspaceElement } from '../../service/persistence/workspace-element';
import * as events from './event-types';
import { testBedSetup } from './tree-viewer.component.spec';

describe('TreeViewerComponent event handling', () => {

  let component: TreeViewerComponent;
  let fixture: ComponentFixture<TreeViewerComponent>;
  let messagingService: MessagingService;

  let singleFile: WorkspaceElement = {
    name: 'file',
    path: 'single-file.txt',
    expanded: false,
    type: 'file',
    children: []
  }

  beforeEach(async(() => {
    testBedSetup();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeViewerComponent);
    component = fixture.componentInstance;
    messagingService = TestBed.get(MessagingService);
    component.model = singleFile;
    fixture.detectChanges();
  });

  function publishEvent(type: string, payload: any): void {
    messagingService.publish(type, payload);
    fixture.detectChanges();
  }

  function getItemKey(): DebugElement {
    return fixture.debugElement.query(By.css('.tree-view .tree-view-item-key'));
  }

  it('onClick() emits "navigation.select" message', () => {
    // given
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_SELECT, callback);

    // when
    component.onClick();
    fixture.detectChanges();

    // then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ path: singleFile.path }));
    expect(getItemKey().classes.selected).toBeTruthy();
  });

  it('onDoubleClick() emits "navigation.open" message', () => {
    // given
    let callback = jasmine.createSpy('callback');
    messagingService.subscribe(events.NAVIGATION_OPEN, callback);

    // when
    component.onDoubleClick();

    // then
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ path: singleFile.path }));
  });

  it('"selected" is unset on non-matching "navigation.select" event', () => {
    // given
    component.selected = true;

    // when
    messagingService.publish(events.NAVIGATION_SELECT, { path: 'random-path' })
    fixture.detectChanges();

    // then
    expect(component.selected).toBeFalsy();
    expect(getItemKey().classes.selected).toBeFalsy();
  });

  it('"selected" is unset on non-matching "editor.active event', () => {
    // given
    component.selected = true;

    // when
    publishEvent(events.EDITOR_ACTIVE, { path: 'random-path' });

    // then
    expect(component.selected).toBeFalsy();
    expect(getItemKey().classes.selected).toBeFalsy();
  });

  it('"active" is set on matching "editor.active" event', () => {
    // given
    expect(component.active).toBeFalsy();

    // when
    publishEvent(events.EDITOR_ACTIVE, { path: singleFile.path });

    // then
    expect(component.active).toBeTruthy();
    expect(getItemKey().classes.active).toBeTruthy();
  });

  it('"active" is unset on non-matching "editor.active" event', () => {
    // given
    component.active = true;

    // when
    publishEvent(events.EDITOR_ACTIVE, { path: 'random-path' });

    // then
    expect(component.active).toBeFalsy();
    expect(getItemKey().classes.active).toBeFalsy();
  });

  it('"active" is unset on matching "editor.close" event', () => {
    // given
    component.active = true;

    // when
    publishEvent(events.EDITOR_CLOSE, { path: singleFile.path });

    // then
    expect(component.active).toBeFalsy();
    expect(getItemKey().classes.active).toBeFalsy();
  });

  it('"dirty" is set on matching "editor.dirtyStateChanged" event with dirty = true', () => {
    // given
    expect(component.dirty).toBeFalsy();
    let eventPayload = {
      path: singleFile.path,
      dirty: true
    };

    // when
    publishEvent(events.EDITOR_DIRTY_CHANGED, eventPayload);

    // then
    expect(component.dirty).toBeTruthy();
    expect(getItemKey().classes.dirty).toBeTruthy();
  });

  it('"dirty" is unset on matching "editor.dirtyStateChanged" event with dirty = false', () => {
    // given
    component.dirty = true;
    let eventPayload = {
      path: singleFile.path,
      dirty: false
    };

    // when
    publishEvent(events.EDITOR_DIRTY_CHANGED, eventPayload);

    // then
    expect(component.dirty).toBeFalsy();
    expect(getItemKey().classes.dirty).toBeFalsy();
  });

  it('"dirty" is unset on matching "editor.close" event', () => {
    // given
    component.dirty = true;

    // when
    publishEvent(events.EDITOR_CLOSE, { path: singleFile.path });

    // then
    expect(component.dirty).toBeFalsy();
    expect(getItemKey().classes.dirty).toBeFalsy();
  });

  it('"dirty" is unaffected on non-matching "editor.dirtyS', () => {
    // given
    component.dirty = true;
    let payload = {
      path: 'random-path',
      dirty: false
    };

    // when
    publishEvent(events.EDITOR_DIRTY_CHANGED, payload);

    // then
    expect(component.dirty).toBeTruthy();
    expect(getItemKey().classes.dirty).toBeTruthy();
  });

});
