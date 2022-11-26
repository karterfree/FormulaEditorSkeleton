import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ITFormulaEditorCommandLineComponent } from './itformula-editor-command-line.component';

describe('ITFormulaEditorCommandLineComponent', () => {
  let component: ITFormulaEditorCommandLineComponent;
  let fixture: ComponentFixture<ITFormulaEditorCommandLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ITFormulaEditorCommandLineComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ITFormulaEditorCommandLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
