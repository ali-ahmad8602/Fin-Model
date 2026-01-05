export const DAYS_IN_YEAR = 360;

export interface CostItem {
  name: string;
  percentage: number; // 0-100
}

/**
 * Calculates simple interest based on 360-day year.
 * @param principal Loan amount
 * @param rate Annual interest rate (percentage, e.g., 14 for 14%)
 * @param days Number of days
 * @returns Interest amount
 */
export const calculateInterest = (principal: number, rate: number, days: number): number => {
  return (principal * (rate / 100) * days) / DAYS_IN_YEAR;
};

/**
 * Calculates sum of variable costs.
 * @param principal Loan amount
 * @param costs Array of CostItems
 * @returns Total variable cost amount
 */
export const calculateVariableCosts = (principal: number, costs: CostItem[]): number => {
  const totalPercentage = costs.reduce((sum, item) => sum + item.percentage, 0);
  return principal * (totalPercentage / 100);
};

/**
 * Calculates the allocated Cost of Capital for a specific loan duration.
 * @param principal Loan principal
 * @param fundCostRate Annual fund cost of capital (percentage)
 * @param days Duration in days
 * @returns Allocated cost amount
 */
export const calculateAllocatedCostOfCapital = (principal: number, fundCostRate: number, days: number): number => {
  return (principal * (fundCostRate / 100) * days) / DAYS_IN_YEAR;
};

/**
 * Calculates Break Even Amount for a loan.
 * Break Even = Principal + Allocated Cost of Capital + Variable Costs
 */
export const calculateBreakEvenAmount = (
  principal: number,
  fundCostRate: number,
  days: number,
  variableCosts: CostItem[]
): number => {
  const allocatedCost = calculateAllocatedCostOfCapital(principal, fundCostRate, days);
  const totalVariableCost = calculateVariableCosts(principal, variableCosts);
  return principal + allocatedCost + totalVariableCost;
};

/**
 * Calculates Net Yield (Profit) for a loan.
 * Net Yield = Total Interest Income - Allocated Cost of Capital - Variable Costs
 */
export const calculateNetYield = (
  principal: number,
  interestRate: number,
  fundCostRate: number,
  days: number,
  variableCosts: CostItem[]
): number => {
  const interestIncome = calculateInterest(principal, interestRate, days);
  const allocatedCost = calculateAllocatedCostOfCapital(principal, fundCostRate, days);
  const totalVariableCost = calculateVariableCosts(principal, variableCosts);

  return interestIncome - allocatedCost - totalVariableCost;
};

/**
 * Generates repayment schedule.
 * Monthly: Uses simple "Equal Principal + Interest" logic (Reducing Balance can be added if needed, sticking to Flat Principal for clarity if not specified, 
 * but standard is Amortization. Let's do Standard Equal Monthly Installments (EMI) if possible, OR simple Principal/N + Interest.
 * User said "monthly installments". Let's do: Principal/Months + Interest on Outstanding Balance. (Reducing Balance).
 */
export const generateRepaymentSchedule = (
  principal: number,
  annualRate: number,
  startDateStr: string,
  durationDays: number,
  type: 'BULLET' | 'MONTHLY'
): { dueDate: string; amount: number; principal: number; interest: number }[] => {
  const startDate = new Date(startDateStr);

  if (type === 'BULLET') {
    const interest = (principal * (annualRate / 100) * durationDays) / DAYS_IN_YEAR;
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + durationDays);

    return [{
      dueDate: dueDate.toISOString(), // simplified
      amount: principal + interest,
      principal: principal,
      interest: interest
    }];
  } else {
    // Monthly
    // Assume 30 days per month for schedule count logic
    const months = Math.floor(durationDays / 30);
    const schedule = [];
    let remainingPrincipal = principal;
    const principalPerMonth = principal / months; // Flat principal repayment
    // Date logic: +30 days each time

    for (let i = 1; i <= months; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + (i * 30));

      // Interest for this month on remaining principal
      // Using 30 days basis for the installment period
      const interest = (remainingPrincipal * (annualRate / 100) * 30) / DAYS_IN_YEAR;
      const total = principalPerMonth + interest;

      schedule.push({
        dueDate: dueDate.toISOString(),
        amount: total,
        principal: principalPerMonth,
        interest: interest
      });

      remainingPrincipal -= principalPerMonth;
    }
    return schedule;
  }
};
