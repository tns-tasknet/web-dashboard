<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	import type { ApexOptions } from 'apexcharts';
	import { Chart } from '@flowbite-svelte-plugins/chart';

	let options: ApexOptions = {
		series: [
			{
				name: 'Ordenes Abiertas',
				data: [
					[new Date('2025-10-01'), 2],
					[new Date('2025-10-02'), 10],
					[new Date('2025-10-03'), 5],
					[new Date('2025-10-04'), 20],
					[new Date('2025-10-05'), 0],
					[new Date('2025-10-06'), 3]
				]
			}
		],
		chart: {
			type: 'area',
			stacked: false,
			height: 350,
			zoom: {
				type: 'x',
				enabled: true,
				autoScaleYaxis: true
			},
			toolbar: {
				autoSelected: 'zoom'
			}
		},
		dataLabels: {
			enabled: false
		},
		markers: {
			size: 0
		},
		fill: {
			type: 'gradient',
			gradient: {
				shadeIntensity: 1,
				inverseColors: false,
				opacityFrom: 0.5,
				opacityTo: 0,
				stops: [0, 90, 100]
			}
		},
		yaxis: {
			labels: {
				formatter: function (val: any) {
					return (val / 1).toFixed(0);
				}
			},
			title: {
				text: 'N° de ordenes'
			}
		},
		xaxis: {
			type: 'datetime'
		},
		tooltip: {
			shared: false,
			y: {
				formatter: function (val: any) {
					return (val / 1).toFixed(0);
				}
			}
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

	import { Datepicker, P } from 'flowbite-svelte';

	let dateRange: { from: Date; to: Date } = $state({
		from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
		to: new Date()
	});
</script>

<div class="flex flex-1 items-center pr-6">
	<div class="flex flex-col">
		<Datepicker
			firstDayOfWeek={1}
			range
			bind:rangeFrom={dateRange.from}
			bind:rangeTo={dateRange.to}
			color="pink"
		/>
		<P class="mt-4">
			Selected range:
			{dateRange.from ? dateRange.from.toLocaleDateString() : 'None'} -
			{dateRange.to ? dateRange.to.toLocaleDateString() : 'None'}
		</P>
	</div>

	<!--<div class="flex flex-1 justify-end"><button class="btn btn-primary">Refrescar</button></div>-->
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
	<div class="flex flex-1 flex-col rounded-xl bg-base-200 p-4">
		<div class="border-b border-b-gray-400 pb-1 text-3xl font-bold">
			Ordenes abiertas por dia
		</div>
		<Chart class="flex flex-1" {options} />
	</div>

	<div class="flex flex-1 flex-col rounded-xl bg-base-200 p-4">
		<div class="border-b border-b-gray-400 pb-1 text-3xl font-bold">Tipo de Reportes</div>
		<Chart class="flex flex-1" options={options2} />
	</div>
</div>
