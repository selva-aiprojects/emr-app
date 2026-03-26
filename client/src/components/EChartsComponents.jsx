import React, { useMemo } from 'react';
import ReactEcharts from 'echarts-for-react';

// Professional Healthcare Color Palette
const HEALTHCARE_COLORS = {
  primary: '#0f766e',      // Medical teal
  secondary: '#06b6d4',    // Medical cyan
  accent: '#10b981',       // Medical green
  warning: '#f59e0b',      // Medical amber
  danger: '#ef4444',       // Medical red
  success: '#22c55e',      // Medical success green
  info: '#3b82f6',         // Medical blue
  muted: '#64748b',        // Medical gray
  lightGray: '#f8fafc',    // Light background
  white: '#ffffff',        // White surface
  darkText: '#1e293b',     // Dark text
  mutedText: '#64748b',    // Muted text
  border: '#e2e8f0',       // Border color
  grid: '#f1f5f9'          // Grid lines
};

// Apache ECharts - Patient Overview Chart (Line Chart)
export const PatientOverviewChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { label: 'Mon', value1: 45, value2: 32 },
    { label: 'Tue', value1: 52, value2: 38 },
    { label: 'Wed', value1: 48, value2: 41 },
    { label: 'Thu', value1: 58, value2: 45 },
    { label: 'Fri', value1: 62, value2: 48 },
    { label: 'Sat', value1: 41, value2: 28 },
    { label: 'Sun', value1: 38, value2: 25 }
  ];

  const option = {
    color: [HEALTHCARE_COLORS.primary, HEALTHCARE_COLORS.accent],
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: HEALTHCARE_COLORS.border,
      borderWidth: 1,
      textStyle: {
        color: HEALTHCARE_COLORS.darkText,
        fontSize: 12,
        fontWeight: 500
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: HEALTHCARE_COLORS.border,
          type: 'dashed'
        }
      }
    },
    legend: {
      data: ['New Patients', 'Returning Patients'],
      textStyle: {
        color: HEALTHCARE_COLORS.mutedText,
        fontSize: 12,
        fontWeight: 600
      },
      top: 0,
      left: 'center'
    },
    grid: {
      top: 40,
      left: 35,
      right: 15,
      bottom: 30,
      containLabel: true,
      backgroundColor: 'transparent'
    },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.label),
      axisLine: {
        lineStyle: {
          color: HEALTHCARE_COLORS.grid,
          width: 1
        }
      },
      axisLabel: {
        color: HEALTHCARE_COLORS.mutedText,
        fontSize: 12,
        fontWeight: 500
      },
      splitLine: {
        lineStyle: {
          color: HEALTHCARE_COLORS.grid,
          type: 'dashed'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: HEALTHCARE_COLORS.grid
        }
      },
      axisLabel: {
        color: HEALTHCARE_COLORS.mutedText,
        fontSize: 11,
        fontWeight: 500
      },
      splitLine: {
        lineStyle: {
          color: HEALTHCARE_COLORS.grid,
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: 'New Patients',
        data: chartData.map(d => d.value1),
        type: 'line',
        smooth: true,
        lineStyle: {
          width: 2.5
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${HEALTHCARE_COLORS.primary}40` },
              { offset: 1, color: `${HEALTHCARE_COLORS.primary}05` }
            ]
          }
        },
        symbolSize: 6,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        }
      },
      {
        name: 'Returning Patients',
        data: chartData.map(d => d.value2),
        type: 'line',
        smooth: true,
        lineStyle: {
          width: 2.5
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${HEALTHCARE_COLORS.accent}40` },
              { offset: 1, color: `${HEALTHCARE_COLORS.accent}05` }
            ]
          }
        },
        symbolSize: 6,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    ]
  };

  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Revenue Trend Chart (Bar Chart)
export const RevenueTrendChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { label: 'Jan', value: 15000 },
    { label: 'Feb', value: 17000 },
    { label: 'Mar', value: 16000 },
    { label: 'Apr', value: 18000 },
    { label: 'May', value: 17000 },
    { label: 'Jun', value: 17000 }
  ];

  const option = {
    color: [HEALTHCARE_COLORS.info],
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: HEALTHCARE_COLORS.border,
      borderWidth: 1,
      textStyle: {
        color: HEALTHCARE_COLORS.darkText,
        fontSize: 12,
        fontWeight: 500
      },
      formatter: (params) => {
        if (params.length > 0) {
          return `${params[0].name}<br/>Revenue: $${params[0].value.toLocaleString()}`;
        }
        return '';
      }
    },
    grid: {
      top: 20,
      left: 50,
      right: 20,
      bottom: 40,
      containLabel: false,
      backgroundColor: 'transparent'
    },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.label),
      axisLine: {
        lineStyle: {
          color: HEALTHCARE_COLORS.grid,
          width: 1
        }
      },
      axisLabel: {
        color: HEALTHCARE_COLORS.mutedText,
        fontSize: 12,
        fontWeight: 500
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: HEALTHCARE_COLORS.grid
        }
      },
      axisLabel: {
        color: HEALTHCARE_COLORS.mutedText,
        fontSize: 11,
        fontWeight: 500,
        formatter: (value) => `$${(value / 1000).toFixed(0)}K`
      },
      splitLine: {
        lineStyle: {
          color: HEALTHCARE_COLORS.grid,
          type: 'dashed'
        }
      }
    },
    series: [
      {
        data: chartData.map(d => d.value),
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: HEALTHCARE_COLORS.info,
          borderRadius: [8, 8, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: HEALTHCARE_COLORS.primary,
            opacity: 0.8
          }
        }
      }
    ]
  };

  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Department Distribution Chart (Pie Chart)
export const DepartmentDistributionChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data.map(d => ({
    name: d.label || d.name,
    value: d.value
  })) : [
    { value: 28, name: 'Cardiology' },
    { value: 22, name: 'Orthopedics' },
    { value: 18, name: 'Neurology' },
    { value: 15, name: 'General' },
    { value: 17, name: 'Emergency' }
  ];

  const colors = [HEALTHCARE_COLORS.primary, HEALTHCARE_COLORS.secondary, HEALTHCARE_COLORS.accent, HEALTHCARE_COLORS.warning, HEALTHCARE_COLORS.info];

  const option = {
    color: colors,
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: HEALTHCARE_COLORS.border,
      borderWidth: 1,
      textStyle: {
        color: HEALTHCARE_COLORS.darkText,
        fontSize: 12,
        fontWeight: 500
      },
      formatter: (params) => `${params.name}<br/>${params.value} beds (${params.percent}%)`
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: chartData.map(d => d.name),
      textStyle: {
        color: HEALTHCARE_COLORS.mutedText,
        fontSize: 10,
        fontWeight: 600
      },
      icon: 'circle'
    },
    series: [
      {
        data: chartData,
        type: 'pie',
        radius: ['45%', '85%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false // Hide labels on lines as they cause shrinking
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            formatter: '{b}\n{c}'
          }
        }
      }
    ]
  };

  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Appointment Status Chart (Horizontal Bar)
export const AppointmentStatusChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data.map(d => ({
    name: d.label || d.name,
    value: d.value
  })) : [
    { name: 'Scheduled', value: 45 },
    { name: 'Completed', value: 32 },
    { name: 'Cancelled', value: 8 },
    { name: 'No-Show', value: 5 }
  ];

  const option = {
    color: [HEALTHCARE_COLORS.success, HEALTHCARE_COLORS.info, HEALTHCARE_COLORS.warning, HEALTHCARE_COLORS.danger],
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: HEALTHCARE_COLORS.border,
      borderWidth: 1,
      textStyle: {
        color: HEALTHCARE_COLORS.darkText,
        fontSize: 12,
        fontWeight: 500
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      top: 10,
      left: 100,
      right: 20,
      bottom: 10,
      containLabel: false,
      backgroundColor: 'transparent'
    },
    xAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisLabel: {
        color: HEALTHCARE_COLORS.mutedText,
        fontSize: 10,
        fontWeight: 500
      },
      splitLine: {
        lineStyle: {
          color: HEALTHCARE_COLORS.grid,
          type: 'dashed'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: chartData.map(d => d.name),
      axisLine: {
        lineStyle: {
          color: HEALTHCARE_COLORS.grid
        }
      },
      axisLabel: {
        color: HEALTHCARE_COLORS.darkText,
        fontSize: 12,
        fontWeight: 600
      }
    },
    series: [
      {
        data: chartData.map(d => d.value),
        type: 'bar',
        barWidth: '50%',
        itemStyle: {
          borderRadius: [0, 8, 8, 0]
        },
        label: {
          show: true,
          position: 'right',
          color: HEALTHCARE_COLORS.darkText,
          fontSize: 11,
          fontWeight: 600,
          formatter: (params) => params.value
        }
      }
    ]
  };

  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Bed Occupancy Chart (Pie/Doughnut)
export const BedOccupancyChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data.map(d => ({
    name: d.label || d.name,
    value: d.value
  })) : [
    { value: 65, name: 'Occupied' },
    { value: 35, name: 'Available' }
  ];

  const option = {
    color: [HEALTHCARE_COLORS.danger, HEALTHCARE_COLORS.success],
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: HEALTHCARE_COLORS.border,
      borderWidth: 1,
      textStyle: {
        color: HEALTHCARE_COLORS.darkText,
        fontSize: 12,
        fontWeight: 500
      },
      formatter: (params) => `${params.name}<br/>${params.value} beds (${params.percent}%)`
    },
    legend: {
      data: chartData.map(d => d.name),
      textStyle: {
        color: HEALTHCARE_COLORS.mutedText,
        fontSize: 11,
        fontWeight: 500
      },
      bottom: 0,
      left: 'center'
    },
    series: [
      {
        data: chartData,
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        label: {
          show: true,
          color: HEALTHCARE_COLORS.white,
          fontSize: 12,
          fontWeight: 700,
          formatter: (params) => `{percent|${params.percent}%}`
        }
      }
    ]
  };

  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Top Diagnoses Chart (Horizontal Bar)
export const TopDiagnosesChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { name: 'Hypertension', value: 124 },
    { name: 'Diabetes Type 2', value: 98 },
    { name: 'Acute Bronchitis', value: 87 },
    { name: 'Osteoarthritis', value: 65 },
    { name: 'UTI', value: 54 }
  ];

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
      type: 'bar',
      barWidth: '60%',
      itemStyle: { borderRadius: [0, 6, 6, 0] },
      label: { show: true, position: 'right', fontWeight: 700 }
    }]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Top Revenue Services Chart (Pie/Doughnut)
export const TopServicesChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { value: 45000, name: 'OPD Consultation' },
    { value: 32000, name: 'Laboratory' },
    { value: 28000, name: 'Pharmacy' },
    { value: 22000, name: 'Radiology' },
    { value: 18000, name: 'Surgeries' }
  ];

  const option = {
    color: ['#0f766e', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'],
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'item', 
      formatter: '{b}: ${c} ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 11 }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'middle',
      type: 'scroll',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        fontSize: 10,
        fontWeight: 600,
        color: '#64748b'
      }
    },
    series: [{
      name: 'Revenue Mix',
      data: chartData,
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { 
        show: true,
        formatter: '{b}: {d}%',
        fontSize: 10,
        fontWeight: 600,
        color: '#64748b'
      },
      emphasis: { 
        label: { 
          show: true, 
          fontSize: 12, 
          fontWeight: 'bold',
          formatter: '{b}\n${c}' 
        } 
      }
    }]
  };
  return <ReactEcharts option={option} style={{ height: '100%', width: '100%' }} />;
};

// Apache ECharts - Staff Distribution Chart (Treemap)
export const StaffDistributionChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data.map(d => ({
    name: d.designation,
    value: parseInt(d.count)
  })) : [
    { name: 'Doctors', value: 12 },
    { name: 'Nurses', value: 24 },
    { name: 'Lab Technicians', value: 8 },
    { name: 'Administrators', value: 5 },
    { name: 'Pharmacists', value: 6 }
  ];

  const option = {
    color: ['#0f766e', '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#3b82f6', '#f59e0b', '#10b981'],
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      orient: 'vertical',
      left: 'left',
      bottom: '10%',
      textStyle: { fontSize: 10 },
      type: 'scroll'
    },
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

// Apache ECharts - Patient Journey Chart (Funnel)
export const PatientJourneyChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data.map(d => ({
    name: d.status.charAt(0).toUpperCase() + d.status.slice(1),
    value: parseInt(d.count)
  })) : [
    { value: 100, name: 'Registered' },
    { value: 80, name: 'Triaged' },
    { value: 60, name: 'Consultation' },
    { value: 40, name: 'Pharmacy/Lab' },
    { value: 30, name: 'Settled' }
  ];

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
      type: 'bar',
      barWidth: '60%',
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

export default {
  PatientOverviewChart,
  RevenueTrendChart,
  DepartmentDistributionChart,
  AppointmentStatusChart,
  BedOccupancyChart,
  TopDiagnosesChart,
  TopServicesChart,
  StaffDistributionChart,
  PatientJourneyChart
};
