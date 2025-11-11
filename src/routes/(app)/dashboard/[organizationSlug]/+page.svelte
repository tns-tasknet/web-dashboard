<script lang="ts">
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();

  import type { ApexOptions } from 'apexcharts';
  import { Chart } from '@flowbite-svelte-plugins/chart';
  import { Datepicker, P } from 'flowbite-svelte';

  // ---------- Fecha (control demo) ----------
  let dateRange: { from: Date; to: Date } = $state({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  // ---------- Helpers MOCK (solo demo visual) ----------
  function daysBetween(from: Date, to: Date) {
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    const out: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      out.push(new Date(d));
    }
    return out;
  }

  // Serie determinística “verosímil” de abiertas por día (no aleatoria)
  // Regla simple: pico a mitad de rango, bajas el fin de semana, etc.
  function mockOpenPerDay(from: Date, to: Date) {
    const ds = daysBetween(from, to);
    const mid = Math.floor(ds.length / 2);
    return ds.map((d, i) => {
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const base = 5 + Math.round(8 * Math.exp(-Math.pow((i - mid) / (ds.length / 5 || 1), 2)));
      const adj = isWeekend ? Math.max(0, base - 3) : base;
      return { x: d.getTime(), y: adj };
    });
  }

  // Distribución por estado (suma ~100) para el rango
  function mockStatusSplit(series: { x: number; y: number }[]) {
    const totalOpen = series.reduce((a, b) => a + b.y, 0);
    if (totalOpen === 0) return { pending: 0, inProgress: 0, onHold: 0 };
    // Proporciones “creíbles”
    const pending = Math.min(60, Math.round((series[series.length - 1]?.y ?? 10) * 3)); // depende del último día
    const inProgress = Math.round((totalOpen / series.length) * 2);
    const onHold = Math.max(5, 100 - pending - inProgress);
    // Normalización rápida a 100
    const sum = pending + inProgress + onHold;
    return {
      pending: Math.round((pending / sum) * 100),
      inProgress: Math.round((inProgress / sum) * 100),
      onHold: 100 - Math.round((pending / sum) * 100) - Math.round((inProgress / sum) * 100)
    };
  }

  // ---------- Series & KPIs derivados del rango ----------
  const openSeries = $derived(mockOpenPerDay(dateRange.from, dateRange.to));
  const kpi_created = $derived(openSeries.length > 0 ? Math.max(18, Math.round(openSeries.reduce((a, b) => a + (b.y > 0 ? 1 : 0), 0) * 1.2)) : 0);
  const kpi_closed = $derived(Math.max(10, Math.round(kpi_created * 0.7)));
  const kpi_openToday = $derived(openSeries[openSeries.length - 1]?.y ?? 0);
  const kpi_sla = $derived( // % “en ventana”
    Math.min(100, Math.max(84, 100 - Math.round((kpi_openToday * 2) % 15)))
  );

  const split = $derived(mockStatusSplit(openSeries));

  // ---------- Chart 1: Área de abiertas por día ----------
  const optionsArea: ApexOptions = $derived({
    series: [
      { name: 'Órdenes abiertas', data: openSeries } // {x: timestamp, y: number}
    ],
    chart: {
      type: 'area',
      height: 320,
      stacked: false,
      zoom: { type: 'x', enabled: true, autoScaleYaxis: true },
      toolbar: { autoSelected: 'zoom' }
    },
    dataLabels: { enabled: false },
    markers: { size: 0 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, inverseColors: false, opacityFrom: 0.45, opacityTo: 0, stops: [0, 90, 100] }
    },
    yaxis: {
      title: { text: 'N° de órdenes' },
      labels: { formatter: (val: number) => `${Math.round(val)}` }
    },
    xaxis: { type: 'datetime' },
    tooltip: {
      shared: false,
      x: { format: 'dd MMM' },
      y: { formatter: (val: number) => `${Math.round(val)}` }
    }
  });

  // ---------- Chart 2: Pie por estado ----------
  const optionsPie: ApexOptions = $derived({
    series: [split.pending, split.inProgress, split.onHold],
    colors: ['#f97316', '#1C64F2', '#9061F9'],
    chart: { type: 'pie', height: 320, width: '100%' },
    stroke: { colors: ['white'] },
    labels: ['Pendiente', 'En progreso', 'En espera'],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
      style: { fontFamily: 'Inter, sans-serif' }
    },
    legend: { position: 'bottom', fontFamily: 'Inter, sans-serif' }
  });
</script>

<!-- Filtro de rango -->
<div class="flex flex-1 items-center justify-between gap-4">
  <div class="flex flex-col">
    <Datepicker
      firstDayOfWeek={1}
      range
      bind:rangeFrom={dateRange.from}
      bind:rangeTo={dateRange.to}
      color="pink"
    />
    <P class="mt-3 text-sm opacity-70">
      Rango seleccionado:
      {dateRange.from ? dateRange.from.toLocaleDateString() : '—'} – {dateRange.to ? dateRange.to.toLocaleDateString() : '—'}
    </P>
  </div>
  <!-- Botón "refrescar" opcional para la demo
  <button class="btn btn-primary">Refrescar</button>
  -->
</div>

<!-- KPIs -->
<div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <div class="card card-border bg-base-100">
    <div class="card-body">
      <h2 class="card-title">Órdenes creadas</h2>
      <p class="text-3xl font-extrabold">{kpi_created}</p>
      <p class="text-xs opacity-60">En el rango seleccionado</p>
    </div>
  </div>

  <div class="card card-border bg-base-100">
    <div class="card-body">
      <h2 class="card-title">Reportes cerrados</h2>
      <p class="text-3xl font-extrabold">{kpi_closed}</p>
      <p class="text-xs opacity-60">Marcadas como “COMPLETED”</p>
    </div>
  </div>

  <div class="card card-border bg-base-100">
    <div class="card-body">
      <h2 class="card-title">Abiertas hoy</h2>
      <p class="text-3xl font-extrabold">{kpi_openToday}</p>
      <p class="text-xs opacity-60">Órdenes activas al cierre de hoy</p>
    </div>
  </div>
</div>

<!-- Gráficos -->
<div class="mt-6 grid gap-6 xl:grid-cols-2">
  <div class="flex flex-col rounded-xl bg-base-200 p-4">
    <div class="border-b border-b-base-300 pb-2 text-xl font-bold">Órdenes abiertas por día</div>
    <Chart class="mt-2 flex-1" options={optionsArea} />
  </div>

  <div class="flex flex-col rounded-xl bg-base-200 p-4">
    <div class="border-b border-b-base-300 pb-2 text-xl font-bold">Órdenes por estado</div>
    <Chart class="mt-2 flex-1" options={optionsPie} />
  </div>
</div>
