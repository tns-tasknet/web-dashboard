<script lang="ts">
	import type { PageProps } from './$types';
	import { authClient } from '$lib/client';
	import { page } from '$app/state';

	let { data }: PageProps = $props();

	let startDate: Date = $state(new Date());
	let endDate: Date = $state(new Date());

	$inspect(startDate);

	import type { ApexOptions } from 'apexcharts';
	import { Chart } from '@flowbite-svelte-plugins/chart';

	let options: ApexOptions = {
		chart: {
			height: '400px',
			type: 'line',
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
		dataLabels: {
			enabled: false
		},
		stroke: {
			width: 6,
			curve: 'smooth'
		},
		grid: {
			show: true,
			strokeDashArray: 4,
			padding: {
				left: 2,
				right: 2,
				top: -26
			}
		},
		series: [
			{
				name: 'Clicks',
				data: [6500, 6418, 6456, 6526, 6356, 6456],
				color: '#1A56DB'
			},
			{
				name: 'CPC',
				data: [6456, 6356, 6526, 6332, 6418, 6500],
				color: '#7E3AF2'
			}
		],
		legend: {
			show: false
		},
		xaxis: {
			categories: ['01 Feb', '02 Feb', '03 Feb', '04 Feb', '05 Feb', '06 Feb', '07 Feb'],
			labels: {
				show: true,
				style: {
					fontFamily: 'Inter, sans-serif',
					cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
				}
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

	const options2: ApexOptions = {
		series: [52.8, 26.8, 20.4],
		colors: ['#1C64F2', '#16BDCA', '#9061F9'],
		chart: {
			height: 420,
			width: '100%',
			type: 'pie'
		},
		stroke: {
			colors: ['white']
		},
		plotOptions: {
			pie: {
				dataLabels: {
					offset: -25
				}
			}
		},
		labels: ['Direct', 'Organic search', 'Referrals'],
		dataLabels: {
			enabled: true,
			style: {
				fontFamily: 'Inter, sans-serif'
			}
		},
		legend: {
			position: 'bottom',
			fontFamily: 'Inter, sans-serif'
		},
		yaxis: {
			labels: {
				formatter: function (value) {
					return value + '%';
				}
			}
		},
		xaxis: {
			labels: {
				formatter: function (value) {
					return value + '%';
				}
			},
			axisTicks: {
				show: false
			},
			axisBorder: {
				show: false
			}
		}
	};
</script>

<div class="flex flex-1 items-center pr-6">
	<div class="flex flex-col">
		<div class="flex items-center">
			Inicio: <input bind:value={startDate} type="date" class="input ml-2" />
		</div>
		<div class="flex items-center">
			Fin: <input bind:value={endDate} type="date" class="input ml-2" />
		</div>
	</div>

	<div class="flex flex-1 justify-end"><button class="btn btn-primary">Refrescar</button></div>
</div>

<div class="flex flex-1 gap-x-2 pt-6">
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

<div class="flex flex-1 gap-x-6 pt-6">
	<div class="flex flex-1 flex-col bg-base-200">
		<div class="text-3xl font-bold">asd</div>
		<Chart class="flex flex-1" {options} />
	</div>

	<div class="flex flex-1 flex-col bg-base-200">
		<div class="text-3xl font-bold">asd</div>
		<Chart class="flex flex-1" options={options2} />
	</div>
</div>
<!-- TODO: STATS -->
<pre>{JSON.stringify(data, null, 4)}</pre>
