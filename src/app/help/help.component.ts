import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgComponentModule } from '../../lib/module/ng-component.module';
import { ViesService } from '../../lib/service/rest.service';
import { HELP_SECTIONS, HelpSection, HelpTopic, QUICK_TASKS } from './help-content';

// The owner's manual: common tasks first, then every area of the Manager in
// plain words — what it is, how to use it, what it changes in the shop.
// Searchable; every topic has a link that can be shared (#topic-id).
@Component({
  selector: 'app-help',
  imports: [NgComponentModule],
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly tasks = QUICK_TASKS;
  readonly all = HELP_SECTIONS;
  query = signal<string>('');
  active = signal<string>('');

  sections = computed<HelpSection[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.all;
    return this.all
      .map(s => ({ ...s, topics: s.topics.filter(t => this.text(t).includes(q) || s.title.toLowerCase().includes(q)) }))
      .filter(s => s.topics.length > 0);
  });
  hits = computed<number>(() => this.sections().reduce((n, s) => n + s.topics.length, 0));
  private text(t: HelpTopic): string {
    return [t.title, t.what, ...(t.how ?? []), ...(t.impact ?? []), ...(t.tips ?? [])].join(' ').replace(/<[^>]+>/g, ' ').toLowerCase();
  }
  html(s: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(s); }

  ngOnInit(): void {
    if (ViesService.isNotCSR()) return;
    this.route.fragment.subscribe(f => { if (f) setTimeout(() => this.jump(f, false), 50); });
  }
  jump(id: string, push = true) {
    this.active.set(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (push) this.router.navigate([], { fragment: id, replaceUrl: true });
  }
  go(route: string) { this.router.navigateByUrl('/' + route); }
  clear() { this.query.set(''); }
}
