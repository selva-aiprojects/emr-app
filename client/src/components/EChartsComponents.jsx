import React from 'react';
import ReactEcharts from 'echarts-for-react';

// Professional Healthcare Color Palette
const HEALTHCARE_COLORS = {
  primary: '#0f766e',
  secondary: '#06b6d4',
  accent: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  success: '#22c55e',
  info: '#3b82f6',
  muted: '#64748b',
  lightGray: '#f8fafc',
  white: '#ffffff',
  darkText: '#1e293b',
  mutedText: '#64748b',
  border: '#e2e8f0',
  grid: '#f1f5f9'
};

const buildEmptyStateOption = (message = 'No live data yet') => ({
  backgroundColor: 'transparent',
  title: {
    text: message,
    left: 'center',
    top: 'middle',
    textStyle: {
      color: HEALTHCARE_COLORS.mutedText,
      fontSize: 13,
      fontWeight: 600
    }
  },
  xAxis: { show: false },
  yAxis: { show: false },
  series: []
});

// Apache ECharts - Patient Overview Chart (Line Chart)
export const PatientOverviewChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data : [];
  if (chartData.length === 0) {
    return <ReactEcharts option={buildEmptyStateOption('No patient trend available')} style={{ height: '100%', width: '100%' }} />;
  }

  const option = {
    color: [HEALTHCARE_COLORS.primary, HEALTHCARE_COLORS.accent],
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: HEALTHCARE_COLORS.border,
      borderWidth: 1,
      textStyle: { color: HEALTHCARE_COLORS.darkText, fontSize: 12, fontWeight: 500 },
      axisPointer: { type: 'line', lineStyle: { color: HEALTHCARE_COLORS.border, type: 'dashed' } }
    },
    legend: {
      data: ['New Patients', 'Returning Patients'],
      textStyle: { color: HEALTHCARE_COLORS.mutedText, fontSize: 12, fontWeight: 600 },
      top: 0, left: 'center'
    },
    grid: { top: 40, left: 35, right: 15, bottom: 30, containLabel: true, backgroundColor: 'transparent' },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.label),
      axisLine: { lineStyle: { color: HEALTHCARE_COLORS.grid, width: 1 } },
      axisLabel: { color: HEALTHCARE_COLORS.mutedText, fontSize: 12, fontWeight: 500 },
      splitLine: { lineStyle: { color: HEALTHCARE_COLORS.grid, type: 'dashed' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: HEALTHCARE_COLORS.grid } },
      axisLabel: { color: HEALTHCARE_COLORS.mutedText, fontSize: 11, fontWeight: 500 },
      splitLine: { lineStyle: { color: HEALTHCARE_COLORS.grid, type: 'dashed' } }
    },
    series: [
      {
        name: 'New Patients',
        data: chartData.map(d => d.value1),
        type: 'line', smooth: true,
        lineStyle: { width: 2.5 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: `${HEALTHCARE_COLORS.primary}40` }, { offset: 1, color: `${HEALTHCARE_COLORS.primary}05` }] }
        },
        symbolSize: 6, itemStyle: { borderColor: '#fff', borderWidth: 2 }
      },
      {
        name: 'Returning Patients',
        data: chartData.map(d => d.value2),
        type: 'line', smooth: true,
        lineStyle: { width: 2.5 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: `${HEALTHCARE_COLORS.accent}40` }, { offset: 1, color: `${HEALTHCARE_COLORS.accent}05` }] }
        },
        symbolSize: 6, itemStyle: { borderColor: '#fff', borderWidth: 2 }
      }
    ]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Revenue Trend Chart (Bar Chart)
export const RevenueTrendChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data : [];
  if (chartData.length === 0) {
    return <ReactEcharts option={buildEmptyStateOption('No revenue trend available')} style={{ height: '100%', width: '100%' }} />;
  }

  const option = {
    color: [HEALTHCARE_COLORS.info],
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: HEALTHCARE_COLORS.border,
      borderWidth: 1,
      textStyle: { color: HEALTHCARE_COLORS.darkText, fontSize: 12, fontWeight: 500 },
      formatter: (params) => params.length > 0 ? `${params[0].name}<br/>Revenue: ₹${params[0].value.toLocaleString()}` : ''
    },
    grid: { top: 20, left: 50, right: 20, bottom: 40, containLabel: false, backgroundColor: 'transparent' },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.label),
      axisLine: { lineStyle: { color: HEALTHCARE_COLORS.grid, width: 1 } },
      axisLabel: { color: HEALTHCARE_COLORS.mutedText, fontSize: 12, fontWeight: 500 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: HEALTHCARE_COLORS.grid } },
      axisLabel: { color: HEALTHCARE_COLORS.mutedText, fontSize: 11, fontWeight: 500, formatter: (v) => `₹${(v / 1000).toFixed(0)}K` },
      splitLine: { lineStyle: { color: HEALTHCARE_COLORS.grid, type: 'dashed' } }
    },
    series: [{
      data: chartData.map(d => d.value),
      type: 'bar', barWidth: '60%',
      itemStyle: { color: HEALTHCARE_COLORS.info, borderRadius: [8, 8, 0, 0] },
      emphasis: { itemStyle: { color: HEALTHCARE_COLORS.primary, opacity: 0.8 } }
    }]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Department Distribution Chart (Pie Chart)
export const DepartmentDistributionChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data.map(d => ({ name: d.label || d.name, value: d.value })) : [];
  if (chartData.length === 0) {
    return <ReactEcharts option={buildEmptyStateOption('No department mix available')} style={{ height: '100%', width: '100%' }} />;
  }

  const colors = [HEALTHCARE_COLORS.primary, HEALTHCARE_COLORS.secondary, HEALTHCARE_COLORS.accent, HEALTHCARE_COLORS.warning, HEALTHCARE_COLORS.info];

  const option = {
    color: colors,
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: HEALTHCARE_COLORS.border,
      borderWidth: 1,
      textStyle: { color: HEALTHCARE_COLORS.darkText, fontSize: 12, fontWeight: 500 },
      formatter: (params) => `${params.name}<br/>${params.value} beds (${params.percent}%)`
    },
    legend: {
      orient: 'vertical', right: 10, top: 'center',
      data: chartData.map(d => d.name),
      textStyle: { color: HEALTHCARE_COLORS.mutedText, fontSize: 10, fontWeight: 600 },
      icon: 'circle'
    },
    series: [{
      data: chartData,
      type: 'pie',
      radius: ['45%', '85%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', formatter: '{b}\n{c}' } }
    }]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Appointment Status Chart (Horizontal Bar)
export const AppointmentStatusChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data.map(d => ({ name: d.label || d.name, value: d.value })) : [];
  if (chartData.length === 0) {
    return <ReactEcharts option={buildEmptyStateOption('No appointment data available')} style={{ height: '100%', width: '100%' }} />;
  }

  const option = {
    color: [HEALTHCARE_COLORS.success, HEALTHCARE_COLORS.info, HEALTHCARE_COLORS.warning, HEALTHCARE_COLORS.danger],
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: HEALTHCARE_COLORS.border,
      borderWidth: 1,
      textStyle: { color: HEALTHCARE_COLORS.darkText, fontSize: 12, fontWeight: 500 },
      axisPointer: { type: 'shadow' }
    },
    grid: { top: 10, left: 100, right: 20, bottom: 10, containLabel: false, backgroundColor: 'transparent' },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: HEALTHCARE_COLORS.mutedText, fontSize: 10, fontWeight: 500 },
      splitLine: { lineStyle: { color: HEALTHCARE_COLORS.grid, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: chartData.map(d => d.name),
      axisLine: { lineStyle: { color: HEALTHCARE_COLORS.grid } },
      axisLabel: { color: HEALTHCARE_COLORS.darkText, fontSize: 12, fontWeight: 600 }
    },
    series: [{
      data: chartData.map(d => d.value),
      type: 'bar', barWidth: '50%',
      itemStyle: { borderRadius: [0, 8, 8, 0] },
      label: { show: true, position: 'right', color: HEALTHCARE_COLORS.darkText, fontSize: 11, fontWeight: 600, formatter: (params) => params.value }
    }]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Bed Occupancy Chart (Pie/Doughnut)
export const BedOccupancyChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data.map(d => ({ name: d.label || d.name, value: d.value })) : [];
  if (chartData.length === 0) {
    return <ReactEcharts option={buildEmptyStateOption('No bed inventory available')} style={{ height: '100%', width: '100%' }} />;
  }

  const option = {
    color: [HEALTHCARE_COLORS.danger, HEALTHCARE_COLORS.success],
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: HEALTHCARE_COLORS.border,
      borderWidth: 1,
      textStyle: { color: HEALTHCARE_COLORS.darkText, fontSize: 12, fontWeight: 500 },
      formatter: (params) => `${params.name}<br/>${params.value} beds (${params.percent}%)`
    },
    legend: {
      data: chartData.map(d => d.name),
      textStyle: { color: HEALTHCARE_COLORS.mutedText, fontSize: 11, fontWeight: 500 },
      bottom: 0, left: 'center'
    },
    series: [{
      data: chartData,
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.2)' } },
      label: { show: true, color: HEALTHCARE_COLORS.white, fontSize: 12, fontWeight: 700, formatter: (params) => `{percent|${params.percent}%}` }
    }]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Top Diagnoses Chart (Horizontal Bar)
export const TopDiagnosesChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data : [];
  if (chartData.length === 0) {
    return <ReactEcharts option={buildEmptyStateOption('No diagnosis data available')} style={{ height: '100%', width: '100%' }} />;
  }

  const option = {
    color: ['#8b5cf6'],
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: 10, left: 100, right: 30, bottom: 10, containLabel: false },
    xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: {
      type: 'category',
      data: chartData.map(d => d.name),
      axisLabel: { fontWeight: 600, fontSize: 11 }
    },
    series: [{
      data: chartData.map(d => d.value),
      type: 'bar', barWidth: '60%',
      itemStyle: { borderRadius: [0, 6, 6, 0] },
      label: { show: true, position: 'right', fontWeight: 700 }
    }]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Top Revenue Services Chart (Pie/Doughnut)
export const TopServicesChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data : [];
  if (chartData.length === 0) {
    return <ReactEcharts option={buildEmptyStateOption('No service mix available')} style={{ height: '100%', width: '100%' }} />;
  }

  const option = {
    color: ['#0f766e', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'],
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ₹{c} ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0', borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 11 }
    },
    legend: {
      orient: 'vertical', right: '5%', top: 'middle',
      type: 'scroll', itemWidth: 10, itemHeight: 10,
      textStyle: { fontSize: 10, fontWeight: 600, color: '#64748b' }
    },
    series: [{
      name: 'Revenue Mix',
      data: chartData,
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {d}%', fontSize: 10, fontWeight: 600, color: '#64748b' },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold', formatter: '{b}\n₹{c}' } }
    }]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Staff Distribution Chart
export const StaffDistributionChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data.map(d => ({ name: d.designation || d.name, value: parseInt(d.count || d.value || 0, 10) })) : [];
  if (chartData.length === 0) {
    return <ReactEcharts option={buildEmptyStateOption('No staff distribution available')} style={{ height: '100%', width: '100%' }} />;
  }

  const option = {
    color: ['#0f766e', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#3b82f6', '#f59e0b', '#10b981'],
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', bottom: '10%', textStyle: { fontSize: 10 }, type: 'scroll' },
    series: [{
      name: 'Staffing',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: true,
      data: chartData,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } }
    }]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Patient Journey Chart (Horizontal Bar / Funnel)
export const PatientJourneyChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data.map(d => ({
    name: d.status.charAt(0).toUpperCase() + d.status.slice(1),
    value: parseInt(d.count)
  })) : [];
  if (chartData.length === 0) {
    return <ReactEcharts option={buildEmptyStateOption('No patient journey available')} style={{ height: '100%', width: '100%' }} />;
  }

  const option = {
    color: ['#10b981'],
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: 20, left: 100, right: 40, bottom: 20, containLabel: false },
    xAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { type: 'dashed' } } },
    yAxis: {
      type: 'category',
      data: chartData.map(d => d.name),
      axisLabel: { fontWeight: 600, fontSize: 11 }
    },
    series: [{
      name: 'Patients',
      data: chartData.map(d => d.value),
      type: 'bar', barWidth: '60%',
      itemStyle: {
        color: (params) => {
          const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
          return colors[params.dataIndex % colors.length];
        },
        borderRadius: [0, 6, 6, 0]
      },
      label: { show: true, position: 'right', fontWeight: 700 }
    }]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - No-Show Rate Analysis (Line + Bar combo)
export const NoShowRateChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data : [];
  if (chartData.length === 0) {
    return <ReactEcharts option={buildEmptyStateOption('No no-show trend available')} style={{ height: '100%', width: '100%' }} />;
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: HEALTHCARE_COLORS.border, borderWidth: 1,
      textStyle: { color: HEALTHCARE_COLORS.darkText, fontSize: 12 },
      formatter: (params) => {
        const bar = params.find(p => p.seriesName === 'No-Shows');
        const line = params.find(p => p.seriesName === 'No-Show Rate %');
        return `${params[0]?.axisValue}<br/>No-Shows: <b>${bar?.value ?? 0}</b><br/>Rate: <b>${line?.value ?? 0}%</b>`;
      }
    },
    legend: {
      data: ['No-Shows', 'No-Show Rate %'],
      top: 0, left: 'center',
      textStyle: { fontSize: 11, fontWeight: 600, color: HEALTHCARE_COLORS.mutedText }
    },
    grid: { top: 36, left: 40, right: 55, bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.label),
      axisLabel: { color: HEALTHCARE_COLORS.mutedText, fontSize: 11 }
    },
    yAxis: [
      { type: 'value', name: 'Count', nameTextStyle: { fontSize: 10 }, axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { type: 'dashed' } } },
      { type: 'value', name: 'Rate %', nameTextStyle: { fontSize: 10 }, axisLabel: { fontSize: 10, formatter: '{value}%' }, splitLine: { show: false }, max: 30 }
    ],
    series: [
      {
        name: 'No-Shows',
        type: 'bar',
        data: chartData.map(d => d.noShow),
        barWidth: '45%',
        itemStyle: { color: HEALTHCARE_COLORS.danger, borderRadius: [4, 4, 0, 0] }
      },
      {
        name: 'No-Show Rate %',
        type: 'line',
        yAxisIndex: 1,
        data: chartData.map(d => d.rate),
        smooth: true,
        lineStyle: { width: 2.5, color: HEALTHCARE_COLORS.warning },
        itemStyle: { color: HEALTHCARE_COLORS.warning, borderColor: '#fff', borderWidth: 2 },
        symbolSize: 6,
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${HEALTHCARE_COLORS.warning}30` },
              { offset: 1, color: `${HEALTHCARE_COLORS.warning}00` }
            ]
          }
        }
      }
    ]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Doctor Performance Chart (Multi-metric horizontal bar)
export const DoctorPerformanceChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data : [];
  if (chartData.length === 0) {
    return <ReactEcharts option={buildEmptyStateOption('No doctor performance data available')} style={{ height: '100%', width: '100%' }} />;
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: HEALTHCARE_COLORS.border, borderWidth: 1,
      textStyle: { fontSize: 11 }
    },
    legend: {
      data: ['Consultations', 'Avg. Time (min)', 'Satisfaction %'],
      top: 0, left: 'center',
      textStyle: { fontSize: 10, fontWeight: 600, color: HEALTHCARE_COLORS.mutedText }
    },
    grid: { top: 40, left: 120, right: 20, bottom: 20, containLabel: false },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: HEALTHCARE_COLORS.mutedText, fontSize: 10 },
      splitLine: { lineStyle: { type: 'dashed', color: HEALTHCARE_COLORS.grid } }
    },
    yAxis: {
      type: 'category',
      data: chartData.map(d => d.name),
      axisLabel: { color: HEALTHCARE_COLORS.darkText, fontSize: 10, fontWeight: 600 }
    },
    series: [
      {
        name: 'Consultations',
        type: 'bar',
        data: chartData.map(d => d.consultations),
        barMaxWidth: 12,
        itemStyle: { color: HEALTHCARE_COLORS.primary, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', fontSize: 10, fontWeight: 700 }
      },
      {
        name: 'Avg. Time (min)',
        type: 'bar',
        data: chartData.map(d => d.avgTime),
        barMaxWidth: 12,
        itemStyle: { color: HEALTHCARE_COLORS.info, borderRadius: [0, 4, 4, 0] }
      },
      {
        name: 'Satisfaction %',
        type: 'bar',
        data: chartData.map(d => d.satisfaction),
        barMaxWidth: 12,
        itemStyle: { color: HEALTHCARE_COLORS.accent, borderRadius: [0, 4, 4, 0] }
      }
    ]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

export default {
  PatientOverviewChart,
  RevenueTrendChart,
  DepartmentDistributionChart,
  AppointmentStatusChart,
  BedOccupancyChart,
  TopDiagnosesChart,
  TopServicesChart,
  StaffDistributionChart,
  PatientJourneyChart,
  NoShowRateChart,
  DoctorPerformanceChart
};
