import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

/** One series for line/bar charts. For doughnut, pass ONE series whose data is the slice values. */
export interface ViesChartSeries {
  label: string;
  data: number[];
  /** Optional explicit color; defaults to the categorical palette slot for the series index. */
  color?: string;
}

// Fixed-order categorical palette (validated for light and dark surfaces —
// assign by slot, never cycle or re-order; >8 series should be folded to
// "Other" by the caller).
const CATEGORICAL_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
const CATEGORICAL_DARK  = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

/**
 * Thin Chart.js wrapper following the house dataviz rules: fixed-order
 * categorical palette, recessive grid, thin marks with rounded data ends,
 * legend only when there are two or more series (doughnuts always name their
 * slices), hover tooltips on. One value axis — callers wanting two measures
 * should render two charts.
 *
 * Client-only: the chart is created in ngAfterViewInit (never during SSR) and
 * rebuilt on input changes. Dark/light is detected from the effective
 * background behind the canvas so the same component works on any theme.
 *
 * Usage:
 *   <app-chart type="line" [labels]="days" [datasets]="[{label:'Revenue', data:[…]}]" [valuePrefix]="'$'"/>
 *   <app-chart type="doughnut" [labels]="statuses" [datasets]="[{label:'Orders', data:[…]}]"/>
 *   <app-chart type="bar" [horizontal]="true" [labels]="countries" [datasets]="[…]"/>
 */
@Component({
  selector: 'app-chart',
  standalone: false,
  template: `<div class="vies-chart-wrap" [style.height.px]="height"><canvas #canvas></canvas></div>`,
  styles: [`
    .vies-chart-wrap { position: relative; width: 100%; }
    canvas { max-width: 100%; }
  `]
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {

  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  @Input() type: 'line' | 'bar' | 'doughnut' = 'line';
  @Input() labels: string[] = [];
  @Input() datasets: ViesChartSeries[] = [];
  /** bar only: horizontal bars (magnitude comparisons read better horizontally). */
  @Input() horizontal = false;
  @Input() height = 260;
  /** Prepended to tick/tooltip values, e.g. a currency symbol. */
  @Input() valuePrefix = '';

  private chart?: Chart;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.rebuild();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewReady) {
      this.rebuild();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }

  private rebuild(): void {
    // SSR / detached guard — Chart.js needs a real canvas + window.
    if (typeof window === 'undefined' || !this.canvasRef?.nativeElement) return;

    this.chart?.destroy();
    this.chart = undefined;
    if (!this.labels.length || !this.datasets.length) return;

    const canvas = this.canvasRef.nativeElement;
    const dark = this.isDarkSurface(canvas);
    const palette = dark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
    const ink = dark ? '#ffffff' : '#0b0b0b';
    const inkSecondary = dark ? '#c3c2b7' : '#52514e';
    const grid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const surface = this.effectiveBackground(canvas) ?? (dark ? '#1a1a19' : '#fcfcfb');

    const isDoughnut = this.type === 'doughnut';
    const prefix = this.valuePrefix;
    const fmt = (v: number | string) =>
      `${prefix}${typeof v === 'number' ? v.toLocaleString() : v}`;

    const chartDatasets = isDoughnut
      ? [{
          label: this.datasets[0].label,
          data: this.datasets[0].data,
          // Slices are identities → fixed-order categorical slots.
          backgroundColor: this.labels.map((_, i) => palette[i % palette.length]),
          // 2px surface-colored gap between segments (the spacer rule).
          borderColor: surface,
          borderWidth: 2
        }]
      : this.datasets.map((s, i) => {
          const color = s.color ?? palette[i % palette.length];
          return this.type === 'line'
            ? {
                label: s.label,
                data: s.data,
                borderColor: color,
                backgroundColor: color,
                borderWidth: 2,
                // A line needs >=2 points to draw anything — with a single
                // bucket, visible markers are the only mark on screen.
                pointRadius: this.labels.length < 2 ? 4 : 0,
                pointHoverRadius: 5,
                pointHitRadius: 12,
                tension: 0
              }
            : {
                label: s.label,
                data: s.data,
                backgroundColor: color,
                // Rounded data ends anchored to the baseline.
                borderRadius: 4,
                borderSkipped: 'start' as const,
                maxBarThickness: 28,
                // 2px surface gap between adjacent bars.
                borderColor: surface,
                borderWidth: this.datasets.length > 1 ? 1 : 0
              };
        });

    const valueAxis = { grid: { color: grid }, ticks: { color: inkSecondary, callback: (v: any) => fmt(v) }, border: { display: false } };
    const labelAxis = { grid: { display: false }, ticks: { color: inkSecondary }, border: { display: false } };

    const config: ChartConfiguration = {
      type: this.type as ChartType,
      data: { labels: this.labels, datasets: chartDatasets as any },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: this.type === 'bar' && this.horizontal ? 'y' : 'x',
        plugins: {
          // Legend when identity needs naming: 2+ series, or doughnut slices.
          legend: {
            display: isDoughnut || this.datasets.length > 1,
            position: isDoughnut ? 'right' : 'top',
            labels: { color: ink, boxWidth: 12, boxHeight: 12, usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const raw = typeof ctx.parsed === 'object'
                  ? (this.horizontal ? ctx.parsed.x : ctx.parsed.y)
                  : ctx.parsed;
                return `${ctx.dataset.label ?? ctx.label}: ${fmt(raw)}`;
              }
            }
          }
        },
        scales: isDoughnut ? undefined : (
          this.type === 'bar' && this.horizontal
            ? { x: valueAxis, y: labelAxis }
            : { x: labelAxis, y: { ...valueAxis, beginAtZero: true } }
        )
      }
    };

    this.chart = new Chart(canvas, config);
  }

  /** Walk up from the canvas to the first non-transparent background and test its luminance. */
  private isDarkSurface(el: HTMLElement): boolean {
    const bg = this.effectiveBackground(el);
    if (!bg) return false;
    const m = bg.match(/\d+(\.\d+)?/g);
    if (!m || m.length < 3) return false;
    const [r, g, b] = m.map(Number);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 128;
  }

  private effectiveBackground(el: HTMLElement): string | null {
    let node: HTMLElement | null = el;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg && bg !== 'transparent' && !/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/.test(bg)) {
        return bg;
      }
      node = node.parentElement;
    }
    return null;
  }
}
