import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpressionEditorComponent } from './expression-editor.component';

describe('ExpressionEditorComponent', () => {
  let component: ExpressionEditorComponent;
  let fixture: ComponentFixture<ExpressionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpressionEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpressionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
