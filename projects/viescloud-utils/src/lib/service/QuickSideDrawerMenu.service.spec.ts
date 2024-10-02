/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { QuickSideDrawerMenuService } from './QuickSideDrawerMenu.service';

describe('Service: QuickSideDrawerMenu', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [QuickSideDrawerMenuService]
    });
  });

  it('should ...', inject([QuickSideDrawerMenuService], (service: QuickSideDrawerMenuService) => {
    expect(service).toBeTruthy();
  }));
});
