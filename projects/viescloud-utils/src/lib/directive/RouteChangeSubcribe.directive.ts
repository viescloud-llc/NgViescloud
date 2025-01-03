import { Directive, Input, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Directive({
  selector: '[viescloudRouteChangeSubcribe]'
})
export abstract class RouteChangeSubcribe implements OnInit {

  constructor(
    protected route: ActivatedRoute
  ) {}

  async ngOnInit() {
    // Subscribe to route changes
    this.route.url.subscribe(async (urlSegments) => {
      // Add logic to handle route changes
      await this.onRouteChange();
    });

    // Or if you want to listen to query params
    this.route.queryParams.subscribe(async (queryParams) => {
      // Handle query param changes
      await this.onParamsChange();
    });
  }

  abstract onRouteChange(): Promise<void>;

  async onParamsChange() {

  }
}
