<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';

	import type { ApexOptions } from 'apexcharts';
	import { Chart } from '@flowbite-svelte-plugins/chart';
	import { Datepicker, P } from 'flowbite-svelte';

	let { data }: PageProps = $props();

	let dateRange: { from: Date | undefined; to: Date | undefined } = $state({
		from: data.dashboard.from ? new Date(`${data.dashboard.from}T00:00:00`) : undefined,
		to: data.dashboard.to ? new Date(`${data.dashboard.to}T00:00:00`) : undefined
	});

	let applying = $state(false);

	async function applyRange() {
		const fromStr = dateRange.from ? dateRange.from.toISOString().slice(0, 10) : '';
		const toStr = dateRange.to ? dateRange.to.toISOString().slice(0, 10) : '';

		if (!fromStr || !toStr) return;
		if (dateRange.from! > dateRange.to!) return;

		applying = true;
		try {
			const qs = new URLSearchParams({ from: fromStr, to: toStr });
			await goto(`?${qs.toString()}`, { keepFocus: true, noScroll: true });
		} finally {
			applying = false;
		}
	}

	// Datos
	const openSeries = $derived(data.dashboard.seriesOpen);
	const kpi_created = $derived(data.dashboard.kpis.created);
	const kpi_closed = $derived(data.dashboard.kpis.closed);
	const kpi_openToday = $derived(data.dashboard.kpis.openEnd);
	const kpi_sla = $derived(data.dashboard.kpis.sla);
	const split = $derived(data.dashboard.split);

	// Gráfico 1: Órdenes abiertas (cumulativo)
	const optionsArea: ApexOptions = $derived({
		series: [{ name: 'Órdenes abiertas', data: openSeries }],
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
			gradient: {
				shadeIntensity: 1,
				inverseColors: false,
				opacityFrom: 0.45,
				opacityTo: 0,
				stops: [0, 90, 100]
			}
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

	// Gráfico 2: Pie por estado
	const optionsPie: ApexOptions = $derived({
		series: [split.pending, split.inProgress, split.scheduled],
		colors: ['#f97316', '#1C64F2', '#9061F9'],
		chart: { type: 'pie', height: 320, width: '100%' },
		stroke: { colors: ['white'] },
		labels: ['Pendiente', 'En progreso', 'Agendada'],
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
	<div class="flex items-end gap-3">
		<div class="flex w-[16rem] flex-col sm:w-[18rem] md:w-[20rem]">
			<Datepicker
				firstDayOfWeek={1}
				range
				bind:rangeFrom={dateRange.from}
				bind:rangeTo={dateRange.to}
				color="pink"
				class="w-full"
				onchange={applyRange}
			/>
		</div>

		<button class="btn mb-1 btn-sm btn-primary" onclick={applyRange} disabled={applying}>
			{#if applying}
				<span class="loading loading-xs loading-spinner"></span>
			{/if}
			Aplicar
		</button>
	</div>
</div>

<!-- KPIs -->
<div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
	<div class="card bg-base-100 card-border">
		<div class="card-body">
			<h2 class="card-title">Órdenes creadas</h2>
			<p class="text-3xl font-extrabold">{kpi_created}</p>
			<p class="text-xs opacity-60">En el rango seleccionado</p>
		</div>
	</div>

	<div class="card bg-base-100 card-border">
		<div class="card-body">
			<h2 class="card-title">Órdenes cerradas</h2>
			<p class="text-3xl font-extrabold">{kpi_closed}</p>
			<p class="text-xs opacity-60">Marcadas como “COMPLETED”</p>
		</div>
	</div>

	<div class="card bg-base-100 card-border">
		<div class="card-body">
			<h2 class="card-title">Órdenes abiertas</h2>
			<p class="text-3xl font-extrabold">{kpi_openToday}</p>
			<p class="text-xs opacity-60">Al final del rango</p>
		</div>
	</div>

	<div class="card bg-base-100 card-border">
		<div class="card-body">
			<h2 class="card-title">Órdenes resueltas en menos de 72h</h2>
			<p class="text-3xl font-extrabold">{kpi_sla}%</p>
			<p class="text-xs opacity-60">De las creadas y cerradas en el rango</p>
		</div>
	</div>
</div>

<!-- Gráficos -->
<div class="mt-6 grid gap-6 xl:grid-cols-2">
	<div class="flex flex-col rounded-xl bg-base-200 p-4">
		<div class="border-b border-b-base-300 pb-2 text-xl font-bold">
			Órdenes abiertas por día
		</div>
		<Chart class="mt-2 flex-1" options={optionsArea} />
	</div>

	<div class="flex flex-col rounded-xl bg-base-200 p-4">
		<div class="border-b border-b-base-300 pb-2 text-xl font-bold">Órdenes por estado</div>
		<Chart class="mt-2 flex-1" options={optionsPie} />
	</div>
</div>
