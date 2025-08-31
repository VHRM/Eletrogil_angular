import { TestBed } from '@angular/core/testing';

import { GoogleApiService } from './google-api-service';

describe('NotaApiService', () => {
  let service: GoogleApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
