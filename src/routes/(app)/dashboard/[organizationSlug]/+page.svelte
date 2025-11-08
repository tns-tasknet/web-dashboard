<script lang="ts">
	import type { PageProps } from './$types';
	import { authClient } from '$lib/client';
	import { page } from '$app/state';

	let { data }: PageProps = $props();

	import type { ApexOptions } from 'apexcharts';
	import { Chart } from '@flowbite-svelte-plugins/chart';

	let options: ApexOptions = {
		chart: {
			height: '400px',
			type: 'area',
			fontFamily: 'Inter, sans-serif',
			dropShadow: {
				enabled: false
			},
			toolbar: {
				show: false
			}
		},
		tooltip: {
			enabled: true,
			x: {
				show: false
			}
		},
		fill: {
			type: 'gradient',
			gradient: {
				opacityFrom: 0.55,
				opacityTo: 0,
				shade: '#1C64F2',
				gradientToColors: ['#1C64F2']
			}
		},
		dataLabels: {
			enabled: false
		},
		stroke: {
			width: 6
		},
		grid: {
			show: false,
			strokeDashArray: 4,
			padding: {
				left: 2,
				right: 2,
				top: 0
			}
		},
		series: [
			{
				name: 'New users',
				data: [6500, 6418, 6456, 6526, 6356, 6456],
				color: '#1A56DB'
			}
		],
		xaxis: {
			categories: [
				'01 February',
				'02 February',
				'03 February',
				'04 February',
				'05 February',
				'06 February',
				'07 February'
			],
			labels: {
				show: false
			},
			axisBorder: {
				show: false
			},
			axisTicks: {
				show: false
			}
		},
		yaxis: {
			show: false
		}
	};
</script>

<div>Fechas Seleccionables [01 Oct 2025 - 31 Oct 2025] -- Refrescar lista</div>
<div class="flex flex-1 gap-x-2">
	<div class="card w-96 bg-base-100 card-border">
		<div class="card-body">
			<h2 class="card-title">Ordenes creadas</h2>
			<p class="text-2xl font-extrabold">32</p>
		</div>
	</div>

	<div class="card w-96 bg-base-100 card-border">
		<div class="card-body">
			<h2 class="card-title">Reportes cerrados</h2>
			<p class="text-2xl font-extrabold">32</p>
		</div>
	</div>

	<div class="card w-96 bg-base-100 card-border">
		<div class="card-body">
			<h2 class="card-title">Stats</h2>
			<p class="text-2xl font-extrabold">32</p>
		</div>
	</div>

	<div class="card w-96 bg-base-100 card-border">
		<div class="card-body">
			<h2 class="card-title">Stats</h2>
			<p class="text-2xl font-extrabold">32</p>
		</div>
	</div>
</div>

<Chart {options} />
<!-- TODO: STATS -->
<pre>{JSON.stringify(data, null, 4)}</pre>
