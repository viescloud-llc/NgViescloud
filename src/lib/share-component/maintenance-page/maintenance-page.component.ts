import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MaintenanceService } from '../../service/maintenance.service';
import { ViesService } from '../../service/rest.service';

/**
 * The page users land on while the backend is in maintenance. Shows the
 * operator's message and the window's end time when scheduled; "Check again"
 * re-probes the public status endpoint and returns home once maintenance is
 * over. Generic — any app using the lib can route '/maintenance' here.
 */
@Component({
  selector: 'viescloud-maintenance-page',
  standalone: false,
  templateUrl: './maintenance-page.component.html',
  styleUrls: ['./maintenance-page.component.scss']
})
export class MaintenancePageComponent implements OnInit {

  readonly maintenance = inject(MaintenanceService);
  private router = inject(Router);

  checking = signal(false);
  stillDown = signal(false);

  ngOnInit(): void {
    if (ViesService.isNotCSR()) return;
    this.check();
  }

  check(): void {
    this.checking.set(true);
    this.stillDown.set(false);
    this.maintenance.refreshStatus().subscribe({
      next: s => {
        this.checking.set(false);
        if (!s.active) {
          this.router.navigate(['/']);
        } else {
          this.stillDown.set(true);
        }
      },
      error: () => {
        this.checking.set(false);
        this.stillDown.set(true);
      }
    });
  }
}
