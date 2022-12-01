import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpressionCommandLineComponent } from './expression-command-line.component';

describe('ExpressionCommandLineComponent', () => {
  let component: ExpressionCommandLineComponent;
  let fixture: ComponentFixture<ExpressionCommandLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpressionCommandLineComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpressionCommandLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
