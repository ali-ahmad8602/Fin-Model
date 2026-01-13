import { calculateXIRR, CashFlow } from './xirr';

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
    // Monthly - REDUCING BALANCE (EMI)
    // PMT Formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const months = Math.max(1, Math.floor(durationDays / 30));
    const monthlyRate = (annualRate / 100) / 12;

    // Calculate EMI
    let emi = 0;
    if (monthlyRate === 0) {
      emi = principal / months;
    } else {
      emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    const schedule = [];
    let outstandingPrincipal = principal;

    for (let i = 1; i <= months; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + (i * 30));

      const interestComponent = outstandingPrincipal * monthlyRate;
      let principalComponent = emi - interestComponent;

      // Handle last installment rounding
      if (i === months) {
        principalComponent = outstandingPrincipal;
        emi = principalComponent + interestComponent;
      }

      outstandingPrincipal -= principalComponent;

      schedule.push({
        dueDate: dueDate.toISOString(),
        amount: emi,
        principal: principalComponent,
        interest: interestComponent
      });
    }
    return schedule;
  }
};

/**
 * Calculates IRR for an individual loan based on income only (gross return).
 *
 * Cash Flow Analysis:
 * - Initial Outflow (Day 0): -Principal
 * - Inflows: Repayment schedule (Principal + Interest + Processing Fee)
 *
 * @param principal Loan principal amount
 * @param interestRate Annual interest rate (percentage)
 * @param processingFeeRate Processing fee rate (percentage of principal)
 * @param startDate Loan start date (ISO string)
 * @param durationDays Loan duration in days
 * @param repaymentType BULLET or MONTHLY
 * @param installments Optional existing installments array
 * @returns IRR as percentage or null if calculation fails
 */
export const calculateLoanIRR = (
  principal: number,
  interestRate: number,
  processingFeeRate: number = 0,
  startDate: string,
  durationDays: number,
  repaymentType: 'BULLET' | 'MONTHLY',
  installments?: { dueDate: string; amount: number }[]
): number | null => {
  const cashFlows: CashFlow[] = [];
  const loanStartDate = new Date(startDate);

  // Initial outflow: -Principal (FEE IS EXCLUDED FROM IRR)
  cashFlows.push({
    amount: -principal,
    date: loanStartDate
  });

  // Use installment DATES if provided, but calculate implied EMI if we needed to correct it?
  // Actually, for IRR calculation of EXISTING loans, we should trust the 'amount' passed in `installments` if possible.
  // BUT the previous logic EXPLICITLY regenerated them. 
  // "Use installment DATES if provided, but regenerate amounts using FLAT INTEREST" was the old comment.
  // The goal of this function is to calculate potentially "Projected" IRR or "True" IRR?
  // If `installments` are passed, we should usually trust their amounts.
  // However, `LoanList` calls this with `loan.installments`.
  // If the user wants to see the IRR of the *actual* schedule, we should USE the amounts.
  // If we regenerate them, we ignore manual edits!
  // The previous code regenerated them presumably to enforce "Flat" logic.
  // I will change this to TRUST the installments amounts if available.
  if (installments && installments.length > 0) {
    installments.forEach((inst) => {
      cashFlows.push({
        amount: inst.amount,
        date: new Date(inst.dueDate)
      });
    });
  } else {
    // Generate schedule based on repayment type
    if (repaymentType === 'BULLET') {
      // Single payment at end (Principal + Interest)
      const interest = calculateInterest(principal, interestRate, durationDays);
      const totalRepayable = principal + interest;
      const dueDate = new Date(loanStartDate);
      dueDate.setDate(dueDate.getDate() + durationDays);

      cashFlows.push({
        amount: totalRepayable,
        date: dueDate
      });
    } else {
      // Monthly payments - REDUCING BALANCE (EMI)
      const months = Math.max(1, Math.floor(durationDays / 30));
      const monthlyRate = (interestRate / 100) / 12;

      let emi = 0;
      if (monthlyRate === 0) {
        emi = principal / months;
      } else {
        emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      }

      for (let i = 1; i <= months; i++) {
        const dueDate = new Date(loanStartDate);
        dueDate.setDate(dueDate.getDate() + (i * 30));

        cashFlows.push({
          amount: emi,
          date: dueDate
        });
      }
    }
  }

  // Calculate and return IRR
  return calculateXIRR(cashFlows);
};

/**
 * Calculates Net IRR for an individual loan (after costs).
 * This shows the actual return after deducting variable costs and cost of capital.
 *
 * @param principal Loan principal amount
 * @param interestRate Annual interest rate (percentage)
 * @param processingFeeRate Processing fee rate (percentage of principal)
 * @param startDate Loan start date (ISO string)
 * @param durationDays Loan duration in days
 * @param repaymentType BULLET or MONTHLY
 * @param variableCosts Array of variable costs
 * @param costOfCapitalRate Fund's cost of capital rate (percentage)
 * @param installments Optional existing installments array
 * @returns Net IRR as percentage or null if calculation fails
 */
export const calculateLoanNetIRR = (
  principal: number,
  interestRate: number,
  processingFeeRate: number = 0,
  startDate: string,
  durationDays: number,
  repaymentType: 'BULLET' | 'MONTHLY',
  variableCosts: CostItem[],
  costOfCapitalRate: number,
  installments?: { dueDate: string; amount: number }[]
): number | null => {
  const cashFlows: CashFlow[] = [];
  const loanStartDate = new Date(startDate);

  // Calculate costs and fee
  const totalVariableCost = calculateVariableCosts(principal, variableCosts);
  const allocatedCostOfCapital = calculateAllocatedCostOfCapital(principal, costOfCapitalRate, durationDays);
  // Initial outflow: -Principal - Variable Costs (FEE IS EXCLUDED FROM IRR)
  cashFlows.push({
    amount: -(principal + totalVariableCost),
    date: loanStartDate
  });

  // Trust existing installments amounts if provided, but we must subtract Cost of Capital portion
  // Problem: We don't know the exact principal portion of each installment if we just use 'amount'.
  // However, Allocated Cost of Capital is usually flat or based on outstanding?
  // Previous logic: "Distribute principal, interest, and cost of capital evenly".
  // Reducing Balance Logic: Cost of Capital should be on Outstanding Principal?
  // Or just flat allocated? 
  // Let's stick to: Net Flow = Installment Amount - (Allocated Cost / numInstallments).
  // This is a simplification but keeps it comparable.

  if (installments && installments.length > 0) {
    const allocatedCostOfCapital = calculateAllocatedCostOfCapital(principal, costOfCapitalRate, durationDays);
    const costPerInstallment = allocatedCostOfCapital / installments.length;

    installments.forEach((inst) => {
      cashFlows.push({
        amount: inst.amount - costPerInstallment,
        date: new Date(inst.dueDate)
      });
    });
  } else {
    // Generate schedule based on repayment type
    if (repaymentType === 'BULLET') {
      const interest = calculateInterest(principal, interestRate, durationDays);
      // Net repayment = Principal + Interest - Cost of Capital
      const netRepayable = principal + interest - allocatedCostOfCapital;
      const dueDate = new Date(loanStartDate);
      dueDate.setDate(dueDate.getDate() + durationDays);

      cashFlows.push({
        amount: netRepayable,
        date: dueDate
      });
    } else {
      // Monthly payments - REDUCING BALANCE (EMI)
      const months = Math.max(1, Math.floor(durationDays / 30));
      const monthlyRate = (interestRate / 100) / 12;

      let emi = 0;
      if (monthlyRate === 0) {
        emi = principal / months;
      } else {
        emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      }

      // We still need to subtract Cost of Capital. 
      // Simplified: Subtract average cost per month.
      const costPerMonth = allocatedCostOfCapital / months;

      for (let i = 1; i <= months; i++) {
        const dueDate = new Date(loanStartDate);
        dueDate.setDate(dueDate.getDate() + (i * 30));

        cashFlows.push({
          amount: emi - costPerMonth,
          date: dueDate
        });
      }
    }
  }

  return calculateXIRR(cashFlows);
};
