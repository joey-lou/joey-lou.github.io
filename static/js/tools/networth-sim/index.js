import { getCurrentColors } from './chart-themes.js';
import { formatCurrency, createChartOptions, destroyChart } from './chart-utils.js';
import { calculateHouseScenario, calculateInvestmentScenario } from './financial-calculations.js';

class NetWorthSimulator {
  constructor() {
    this.charts = {
      netWorth: null,
      houseCostsPie: null,
      houseEquity: null,
      investmentDetails: null,
      combinedCashFlow: null,
    };
    this.isMonthlyView = true;
    this.colorScheme = getCurrentColors();

    this.inputs = {
      housePrice: document.getElementById('housePrice'),
      downPayment: document.getElementById('downPayment'),
      mortgageRate: document.getElementById('mortgageRate'),
      mortgageTerm: document.getElementById('mortgageTerm'),
      houseAppreciation: document.getElementById('houseAppreciation'),
      investmentReturn: document.getElementById('investmentReturn'),
      monthlyRent: document.getElementById('monthlyRent'),
      timeHorizon: document.getElementById('timeHorizon'),
      propertyTax: document.getElementById('propertyTax'),
      maintenance: document.getElementById('maintenance'),
      rentGrowth: document.getElementById('rentGrowth'),
    };

    this.initializeEventListeners();
    this.calculate();
  }

  initializeEventListeners() {
    Object.values(this.inputs).forEach((input) => {
      input.addEventListener('input', () => this.calculate());
    });

    document.getElementById('monthlyView').addEventListener('change', () => {
      this.isMonthlyView = true;
      this.updateCombinedCashFlowChart();
    });
    document.getElementById('yearlyView').addEventListener('change', () => {
      this.isMonthlyView = false;
      this.updateCombinedCashFlowChart();
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-bs-theme') {
          this.colorScheme = getCurrentColors();
          this.calculate();
        }
      });
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-bs-theme'] });
  }

  getInputValues() {
    const getValue = (input, divisor = 1, defaultVal = 0) => {
      const val = parseFloat(input.value);
      return isNaN(val) || !isFinite(val) ? defaultVal : val / divisor;
    };

    return {
      housePrice: getValue(this.inputs.housePrice, 1, 500000),
      downPaymentPercent: getValue(this.inputs.downPayment, 1, 20),
      mortgageRate: getValue(this.inputs.mortgageRate, 100, 0.065),
      mortgageTerm: parseInt(this.inputs.mortgageTerm.value) || 30,
      houseAppreciation: getValue(this.inputs.houseAppreciation, 100, 0.03),
      investmentReturn: getValue(this.inputs.investmentReturn, 100, 0.07),
      monthlyRent: getValue(this.inputs.monthlyRent, 1, 2000),
      timeHorizon: parseInt(this.inputs.timeHorizon.value) || 30,
      propertyTax: getValue(this.inputs.propertyTax, 100, 0.012),
      maintenance: getValue(this.inputs.maintenance, 100, 0.01),
      rentGrowth: getValue(this.inputs.rentGrowth, 100, 0.03),
    };
  }

  updateResults(houseResult, investResult, values) {
    document.getElementById('years1').textContent = values.timeHorizon;
    document.getElementById('years2').textContent = values.timeHorizon;

    document.getElementById('houseNetWorth').textContent = formatCurrency(
      houseResult.finalNetWorth
    );
    document.getElementById('finalHouseValue').textContent = formatCurrency(
      houseResult.finalHouseValue
    );
    document.getElementById('remainingMortgage').textContent = formatCurrency(
      houseResult.remainingMortgage
    );
    const totalCosts =
      houseResult.totalPrincipalPaid +
      houseResult.totalInterestPaid +
      houseResult.totalPropertyTax +
      houseResult.totalMaintenance;
    document.getElementById('totalCosts').textContent = formatCurrency(totalCosts);

    document.getElementById('investNetWorth').textContent = formatCurrency(
      investResult.finalNetWorth
    );
    document.getElementById('finalInvestValue').textContent = formatCurrency(
      investResult.finalInvestValue
    );
    document.getElementById('totalRent').textContent = formatCurrency(investResult.totalRent);

    const houseCard = document.querySelector('.scenario-card.house');
    const investCard = document.querySelector('.scenario-card.invest');
    const houseValue = houseCard.querySelector('.metric-value');
    const investValue = investCard.querySelector('.metric-value');

    if (houseResult.finalNetWorth > investResult.finalNetWorth) {
      houseValue.style.color = this.colorScheme.success;
      investValue.style.color = this.colorScheme.danger;
    } else {
      houseValue.style.color = this.colorScheme.danger;
      investValue.style.color = this.colorScheme.success;
    }
  }

  updateNetWorthChart(houseResult, investResult) {
    const ctx = document.getElementById('netWorthChart').getContext('2d');

    const years = houseResult.yearlyData.map((d) => d.year);
    const houseNetWorth = houseResult.yearlyData.map((d) => d.netWorth);
    const investNetWorth = investResult.yearlyData.map((d) => d.netWorth);

    const houseWins = houseResult.finalNetWorth > investResult.finalNetWorth;
    const houseColor = houseWins ? this.colorScheme.success : this.colorScheme.danger;
    const investColor = houseWins ? this.colorScheme.danger : this.colorScheme.success;
    const houseColorRgba = houseWins ? this.colorScheme.successAlpha : this.colorScheme.dangerAlpha;
    const investColorRgba = houseWins
      ? this.colorScheme.dangerAlpha
      : this.colorScheme.successAlpha;

    if (this.charts.netWorth) {
      this.charts.netWorth.destroy();
    }

    this.charts.netWorth = new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Buy House',
            data: houseNetWorth,
            borderColor: houseColor,
            backgroundColor: houseColorRgba,
            borderWidth: 3,
            fill: false,
            tension: 0.1,
          },
          {
            label: 'Invest Cash',
            data: investNetWorth,
            borderColor: investColor,
            backgroundColor: investColorRgba,
            borderWidth: 3,
            fill: false,
            tension: 0.1,
          },
        ],
      },
      options: {
        ...createChartOptions('Net Worth Comparison Over Time', 'Net Worth ($)'),
        plugins: {
          ...createChartOptions('Net Worth Comparison Over Time', 'Net Worth ($)').plugins,
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(context.parsed.y);
                return context.dataset.label + ': ' + value;
              },
            },
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: this.colorScheme.textColor,
            },
          },
        },
        scales: {
          ...createChartOptions('Net Worth Comparison Over Time', 'Net Worth ($)').scales,
          x: {
            ...createChartOptions('Net Worth Comparison Over Time', 'Net Worth ($)').scales.x,
            title: {
              display: true,
              text: 'Years',
              color: this.colorScheme.textColor,
            },
          },
        },
      },
    });
  }

  updateHouseCostsPieChart(houseResult) {
    const ctx = document.getElementById('houseCostsPieChart').getContext('2d');

    if (this.charts.houseCostsPie) {
      this.charts.houseCostsPie.destroy();
    }

    this.charts.houseCostsPie = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Principal Paid', 'Interest Paid', 'Property Tax', 'Maintenance'],
        datasets: [
          {
            data: [
              houseResult.totalPrincipalPaid,
              houseResult.totalInterestPaid,
              houseResult.totalPropertyTax,
              houseResult.totalMaintenance,
            ],
            backgroundColor: [
              this.colorScheme.success,
              this.colorScheme.danger,
              this.colorScheme.warning,
              this.colorScheme.secondary,
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Total Housing Costs Breakdown',
            color: this.colorScheme.textColor,
            font: {
              size: 16,
              weight: 'normal',
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = formatCurrency(context.parsed);
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return context.label + ': ' + value + ' (' + percentage + '%)';
              },
            },
          },
          legend: {
            labels: {
              color: this.colorScheme.textColor,
            },
          },
        },
      },
    });
  }

  updateHouseEquityChart(houseResult) {
    const ctx = document.getElementById('houseEquityChart').getContext('2d');
    destroyChart(this.charts, 'houseEquity');

    const equityDatasets = [
      { label: 'House Value', data: 'houseValue', color: this.colorScheme.success },
      { label: 'Remaining Mortgage', data: 'remainingMortgage', color: this.colorScheme.danger },
      { label: 'Equity', data: 'equity', color: this.colorScheme.info },
    ];

    this.charts.houseEquity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: houseResult.yearlyData.map((d) => d.year),
        datasets: equityDatasets.map(({ label, data, color }) => ({
          label,
          data: houseResult.yearlyData.map((d) => d[data]),
          borderColor: color,
          backgroundColor: color + '1A',
          fill: false,
        })),
      },
      options: createChartOptions('House Equity vs Liability Over Time', 'Value ($)'),
    });
  }

  updateInvestmentDetailsChart(investResult) {
    const ctx = document.getElementById('investmentDetailsChart').getContext('2d');

    if (this.charts.investmentDetails) {
      this.charts.investmentDetails.destroy();
    }

    const years = investResult.yearlyData.map((d) => d.year);

    this.charts.investmentDetails = new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Total Investment Value',
            data: investResult.yearlyData.map((d) => d.investmentValue),
            borderColor: this.colorScheme.success,
            backgroundColor: this.colorScheme.successAlpha,
            fill: false,
          },
          {
            label: 'Cumulative Cash Flow',
            data: investResult.yearlyData.map((d) => d.totalCashFlowInvested),
            borderColor: this.colorScheme.info,
            backgroundColor: this.colorScheme.infoAlpha,
            fill: false,
          },
          {
            label: 'Cumulative Returns',
            data: investResult.yearlyData.map((d) => d.totalReturnOnInvestment),
            borderColor: this.colorScheme.warning,
            backgroundColor: this.colorScheme.warningAlpha,
            fill: false,
          },
          {
            label: 'Cumulative Rent Paid',
            data: investResult.yearlyData.map((d) => -d.totalRentPaid),
            borderColor: this.colorScheme.danger,
            backgroundColor: this.colorScheme.dangerAlpha,
            fill: false,
          },
        ],
      },
      options: {
        ...createChartOptions('Investment Scenario Breakdown', 'Value ($)'),
        plugins: {
          ...createChartOptions('Investment Scenario Breakdown', 'Value ($)').plugins,
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = formatCurrency(Math.abs(context.parsed.y));
                return context.dataset.label + ': ' + value;
              },
            },
          },
        },
      },
    });
  }

  updateCombinedCashFlowChart(houseResult = null, investResult = null) {
    if (!houseResult || !investResult) {
      if (!this.lastResults) return;
      houseResult = this.lastResults.houseResult;
      investResult = this.lastResults.investResult;
    } else {
      this.lastResults = { houseResult, investResult };
    }

    const ctx = document.getElementById('combinedCashFlowChart').getContext('2d');
    destroyChart(this.charts, 'combinedCashFlow');

    const filteredHouseData = houseResult.yearlyData.filter((d) => d.year > 0);
    const filteredInvestData = investResult.yearlyData.filter((d) => d.year > 0);

    const divisor = this.isMonthlyView ? 12 : 1;
    const timeLabel = this.isMonthlyView ? 'Monthly' : 'Annual';

    const datasets = [
      {
        label: `${timeLabel} Mortgage`,
        data: filteredHouseData.map((d) => (d.annualPrincipal + d.annualInterest) / divisor),
        backgroundColor: this.colorScheme.danger,
        borderColor: this.colorScheme.dangerDark,
        borderWidth: 1,
        stack: 'housing',
      },
      {
        label: `${timeLabel} Property Tax`,
        data: filteredHouseData.map((d) => d.annualPropertyTax / divisor),
        backgroundColor: this.colorScheme.warning,
        borderColor: this.colorScheme.warningDark,
        borderWidth: 1,
        stack: 'housing',
      },
      {
        label: `${timeLabel} Maintenance`,
        data: filteredHouseData.map((d) => d.annualMaintenance / divisor),
        backgroundColor: this.colorScheme.secondary,
        borderColor: this.colorScheme.secondaryDark,
        borderWidth: 1,
        stack: 'housing',
      },
      {
        label: `${timeLabel} Rent`,
        data: filteredInvestData.map((d) => d.annualRent / divisor),
        backgroundColor: this.colorScheme.warningDark,
        borderColor: this.colorScheme.warningDarkest,
        borderWidth: 1,
        stack: 'investment',
      },
      {
        label: `${timeLabel} Net Cash Flow`,
        data: filteredInvestData.map((d) => d.annualCashFlow / divisor),
        backgroundColor: filteredInvestData.map((d) =>
          d.annualCashFlow >= 0 ? this.colorScheme.success : this.colorScheme.danger
        ),
        borderColor: filteredInvestData.map((d) =>
          d.annualCashFlow >= 0 ? this.colorScheme.successDark : this.colorScheme.dangerDark
        ),
        borderWidth: 1,
        stack: 'investment',
      },
    ];

    this.charts.combinedCashFlow = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: filteredHouseData.map((d) => d.year),
        datasets: datasets,
      },
      options: {
        ...createChartOptions(
          `${timeLabel} Cash Flow Comparison: Housing vs Investment`,
          `${timeLabel} Cost ($)`,
          true
        ),
        plugins: {
          ...createChartOptions(
            `${timeLabel} Cash Flow Comparison: Housing vs Investment`,
            `${timeLabel} Cost ($)`,
            true
          ).plugins,
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = formatCurrency(context.parsed.y);
                return context.dataset.label + ': ' + value;
              },
            },
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: this.colorScheme.textColor,
            },
          },
        },
        scales: {
          ...createChartOptions(
            `${timeLabel} Cash Flow Comparison: Housing vs Investment`,
            `${timeLabel} Cost ($)`,
            true
          ).scales,
          x: {
            ...createChartOptions(
              `${timeLabel} Cash Flow Comparison: Housing vs Investment`,
              `${timeLabel} Cost ($)`,
              true
            ).scales.x,
            title: {
              display: true,
              text: 'Years',
              color: this.colorScheme.textColor,
            },
          },
        },
      },
    });
  }

  calculate() {
    const values = this.getInputValues();

    if (values.timeHorizon === 0) return;

    const houseResult = calculateHouseScenario(values);
    const investResult = calculateInvestmentScenario(values);

    this.updateResults(houseResult, investResult, values);
    this.updateNetWorthChart(houseResult, investResult);
    this.updateHouseCostsPieChart(houseResult);
    this.updateHouseEquityChart(houseResult);
    this.updateInvestmentDetailsChart(investResult);
    this.updateCombinedCashFlowChart(houseResult, investResult);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new NetWorthSimulator();
});
