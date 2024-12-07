import { Directive, Input, HostBinding, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Directive({
  selector: '[viescloudRouteChangeSubcribe]'
})
export class RouteChangeSubcribe implements OnInit {

  constructor(
    protected route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Subscribe to route changes
    this.route.url.subscribe((urlSegments) => {
      // Add logic to handle route changes
      this.onRouteChange();
    });

    // Or if you want to listen to query params
    this.route.queryParams.subscribe((queryParams) => {
      // Handle query param changes
      this.onParamsChange();
    });
  }

  onRouteChange() {

  }

  onParamsChange() {

  }

}
