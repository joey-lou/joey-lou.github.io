function safeCalculate(calculation, fallback = 0) {
  const result = calculation();
  return isNaN(result) || !isFinite(result) ? fallback : result;
}

function calculateMortgagePayment(principal, rate, years) {
  return safeCalculate(() => {
    const monthlyRate = rate / 12;
    const numPayments = years * 12;

    if (rate === 0 || monthlyRate === 0) return principal / numPayments;

    return (
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    );
  }, 0);
}

function calculateHouseValue(initialPrice, appreciation, year) {
  return safeCalculate(() => initialPrice * Math.pow(1 + appreciation, year), initialPrice);
}

function calculateAnnualPropertyTax(houseValue, taxRate) {
  return safeCalculate(() => houseValue * taxRate);
}

function calculateAnnualMaintenance(houseValue, maintenanceRate) {
  return safeCalculate(() => houseValue * maintenanceRate);
}

function calculateTotalHousingCosts(mortgagePayment, propertyTax, maintenance, year, mortgageTerm) {
  const annualMortgage = year <= mortgageTerm ? mortgagePayment * 12 : 0;
  return annualMortgage + propertyTax + maintenance;
}

function processMonthlyMortgagePayments(remainingBalance, monthlyPayment, mortgageRate) {
  let annualPrincipal = 0;
  let annualInterest = 0;

  for (let month = 1; month <= 12 && remainingBalance > 0; month++) {
    const monthlyInterest = (remainingBalance * mortgageRate) / 12;
    const monthlyPrincipal = Math.min(monthlyPayment - monthlyInterest, remainingBalance);

    remainingBalance -= monthlyPrincipal;
    annualPrincipal += monthlyPrincipal;
    annualInterest += monthlyInterest;
  }

  return { remainingBalance, annualPrincipal, annualInterest };
}

function calculateHouseScenario(values) {
  const downPaymentAmount = safeCalculate(
    () => (values.housePrice * values.downPaymentPercent) / 100
  );
  const loanAmount = safeCalculate(() => values.housePrice - downPaymentAmount);
  const monthlyPayment = calculateMortgagePayment(
    loanAmount,
    values.mortgageRate,
    values.mortgageTerm
  );

  const yearlyData = [];
  let currentHouseValue = values.housePrice;
  let remainingBalance = loanAmount;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let totalPropertyTax = 0;
  let totalMaintenance = 0;

  yearlyData.push({
    year: 0,
    netWorth: currentHouseValue - remainingBalance,
    houseValue: currentHouseValue,
    remainingMortgage: remainingBalance,
    equity: currentHouseValue - remainingBalance,
    annualPrincipal: 0,
    annualInterest: 0,
    annualPropertyTax: 0,
    annualMaintenance: 0,
    totalPrincipalPaid: 0,
    totalInterestPaid: 0,
    totalPropertyTax: 0,
    totalMaintenance: 0,
  });

  for (let year = 1; year <= values.timeHorizon; year++) {
    currentHouseValue = calculateHouseValue(values.housePrice, values.houseAppreciation, year);

    const annualPropertyTax = calculateAnnualPropertyTax(currentHouseValue, values.propertyTax);
    const annualMaintenance = calculateAnnualMaintenance(currentHouseValue, values.maintenance);

    let annualPrincipal = 0;
    let annualInterest = 0;

    if (year <= values.mortgageTerm && remainingBalance > 0) {
      const mortgageResult = processMonthlyMortgagePayments(
        remainingBalance,
        monthlyPayment,
        values.mortgageRate
      );
      remainingBalance = mortgageResult.remainingBalance;
      annualPrincipal = mortgageResult.annualPrincipal;
      annualInterest = mortgageResult.annualInterest;

      totalPrincipalPaid += annualPrincipal;
      totalInterestPaid += annualInterest;
    }

    totalPropertyTax += annualPropertyTax;
    totalMaintenance += annualMaintenance;

    const equity = currentHouseValue - remainingBalance;
    yearlyData.push({
      year,
      netWorth: equity,
      houseValue: currentHouseValue,
      remainingMortgage: remainingBalance,
      equity,
      annualPrincipal,
      annualInterest,
      annualPropertyTax,
      annualMaintenance,
      totalPrincipalPaid,
      totalInterestPaid,
      totalPropertyTax,
      totalMaintenance,
    });
  }

  return {
    yearlyData,
    finalNetWorth: yearlyData[yearlyData.length - 1]?.netWorth || 0,
    finalHouseValue: currentHouseValue,
    remainingMortgage: remainingBalance,
    totalPrincipalPaid,
    totalInterestPaid,
    totalPropertyTax,
    totalMaintenance,
  };
}

function calculateInvestmentScenario(values) {
  const downPaymentAmount = safeCalculate(
    () => (values.housePrice * values.downPaymentPercent) / 100
  );
  const loanAmount = safeCalculate(() => values.housePrice - downPaymentAmount);
  const monthlyPayment = calculateMortgagePayment(
    loanAmount,
    values.mortgageRate,
    values.mortgageTerm
  );

  let investmentValue = downPaymentAmount;
  let totalRentPaid = 0;
  let totalCashFlowInvested = 0;
  let totalReturnOnInvestment = 0;
  const yearlyData = [];

  yearlyData.push({
    year: 0,
    netWorth: investmentValue,
    investmentValue,
    totalRentPaid: 0,
    totalCashFlowInvested: 0,
    totalReturnOnInvestment: 0,
    annualCashFlow: 0,
    annualReturns: 0,
    annualRent: 0,
    monthlyRent: values.monthlyRent,
  });

  for (let year = 1; year <= values.timeHorizon; year++) {
    const houseValue = calculateHouseValue(values.housePrice, values.houseAppreciation, year);
    const annualPropertyTax = calculateAnnualPropertyTax(houseValue, values.propertyTax);
    const annualMaintenance = calculateAnnualMaintenance(houseValue, values.maintenance);
    const totalHousingCosts = calculateTotalHousingCosts(
      monthlyPayment,
      annualPropertyTax,
      annualMaintenance,
      year,
      values.mortgageTerm
    );

    const currentYearRent = values.monthlyRent * Math.pow(1 + values.rentGrowth, year - 1);
    const annualRent = currentYearRent * 12;
    totalRentPaid += annualRent;

    const cashFlowDifference = totalHousingCosts - annualRent;
    totalCashFlowInvested += cashFlowDifference;

    const investmentReturns = investmentValue * values.investmentReturn;
    totalReturnOnInvestment += investmentReturns;

    investmentValue = investmentValue * (1 + values.investmentReturn) + cashFlowDifference;

    yearlyData.push({
      year,
      netWorth: investmentValue,
      investmentValue,
      totalRentPaid,
      totalCashFlowInvested,
      totalReturnOnInvestment,
      annualCashFlow: cashFlowDifference,
      annualReturns: investmentReturns,
      annualRent,
      monthlyRent: currentYearRent,
    });
  }

  return {
    yearlyData,
    finalNetWorth: investmentValue,
    finalInvestValue: investmentValue,
    totalRent: totalRentPaid,
    totalCashFlowInvested,
    totalReturnOnInvestment,
    monthlyRent: values.monthlyRent,
  };
}

export {
  safeCalculate,
  calculateMortgagePayment,
  calculateHouseValue,
  calculateAnnualPropertyTax,
  calculateAnnualMaintenance,
  calculateTotalHousingCosts,
  processMonthlyMortgagePayments,
  calculateHouseScenario,
  calculateInvestmentScenario,
};
