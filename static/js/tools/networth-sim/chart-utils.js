import { getCurrentColors } from './chart-themes.js';

function formatCurrency(amount) {
  const value = isNaN(amount) || !isFinite(amount) ? 0 : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function createChartOptions(title, yAxisTitle, isStacked = false) {
  const colors = getCurrentColors();

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      title: {
        display: true,
        text: title,
        color: colors.textColor,
        font: {
          size: 16,
          weight: 'normal',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = formatCurrency(context.parsed.y || Math.abs(context.parsed));
            return context.dataset.label + ': ' + value;
          },
        },
      },
      legend: {
        labels: {
          color: colors.textColor,
        },
      },
    },
    scales: {
      x: {
        grid: { color: colors.gridColor },
        ticks: { color: colors.textColor },
        title: { color: colors.textColor },
      },
      y: {
        title: {
          display: true,
          text: yAxisTitle,
          color: colors.textColor,
        },
        ticks: {
          callback: (value) => formatCurrency(value),
          color: colors.textColor,
        },
        grid: { color: colors.gridColor },
      },
    },
  };

  if (isStacked) {
    baseOptions.scales.x.stacked = true;
    baseOptions.scales.y.stacked = true;
  }

  return baseOptions;
}

function destroyChart(charts, chartKey) {
  if (charts[chartKey]) {
    charts[chartKey].destroy();
  }
}

export { formatCurrency, createChartOptions, destroyChart };
