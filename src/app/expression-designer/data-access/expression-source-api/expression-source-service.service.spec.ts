import { TestBed } from '@angular/core/testing';

import { ExpressionSourceServiceService } from './expression-source-service.service';

describe('ExpressionSourceServiceService', () => {
  let service: ExpressionSourceServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpressionSourceServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
