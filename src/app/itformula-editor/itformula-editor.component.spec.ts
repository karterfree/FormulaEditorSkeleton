import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ITFormulaEditorComponent } from './itformula-editor.component';

describe('ITFormulaEditorComponent', () => {
  let component: ITFormulaEditorComponent;
  let fixture: ComponentFixture<ITFormulaEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ITFormulaEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ITFormulaEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
