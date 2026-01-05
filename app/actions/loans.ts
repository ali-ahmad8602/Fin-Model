"use server";

import { prisma } from "@/lib/prisma";
import { Loan, LoanStatus, CostItem, Installment, RepaymentType } from "@/types";
import { revalidatePath } from "next/cache";

// Helper to map Prisma Loan to our Type
const mapLoan = (l: any): Loan => ({
    id: l.id,
    fundId: l.fundId,
    borrowerName: l.borrowerName,
    principal: l.principal,
    interestRate: l.interestRate,
    startDate: l.startDate.toISOString(),
    durationDays: l.durationDays,
    status: l.status as LoanStatus,
    repaymentType: l.repaymentType as RepaymentType,
    defaultedAmount: l.defaultedAmount || undefined,
    variableCosts: l.variableCosts.map((vc: any) => ({
        id: vc.id,
        name: vc.name,
        percentage: vc.percentage
    })),
    installments: l.installments.map((i: any) => ({
        id: i.id,
        dueDate: i.dueDate.toISOString(),
        amount: i.amount,
        principalComponent: i.principalComponent,
        interestComponent: i.interestComponent,
        status: i.status as "PENDING" | "PAID" | "OVERDUE"
    }))
});

export async function getLoansAction(): Promise<Loan[]> {
    const loans = await prisma.loan.findMany({
        include: {
            variableCosts: true,
            installments: true
        },
        orderBy: { createdAt: 'desc' }
    });
    return loans.map(mapLoan);
}

export async function addLoanAction(data: Omit<Loan, 'id'>): Promise<Loan> {
    // Transactional create
    const loan = await prisma.loan.create({
        data: {
            fundId: data.fundId,
            borrowerName: data.borrowerName,
            principal: data.principal,
            interestRate: data.interestRate,
            startDate: new Date(data.startDate),
            durationDays: data.durationDays,
            status: data.status,
            repaymentType: data.repaymentType,
            variableCosts: {
                create: data.variableCosts.map(vc => ({
                    name: vc.name,
                    percentage: vc.percentage
                }))
            },
            installments: {
                create: data.installments.map(i => ({
                    dueDate: new Date(i.dueDate),
                    amount: i.amount,
                    principalComponent: i.principalComponent,
                    interestComponent: i.interestComponent,
                    status: i.status
                }))
            }
        },
        include: { variableCosts: true, installments: true }
    });

    revalidatePath('/');
    revalidatePath(`/funds/${data.fundId}`);
    return mapLoan(loan);
}

export async function updateLoanStatusAction(loanId: string, status: LoanStatus, defaultedAmount?: number): Promise<void> {
    await prisma.loan.update({
        where: { id: loanId },
        data: {
            status,
            defaultedAmount
        }
    });
    revalidatePath('/');
}

export async function deleteLoanAction(loanId: string): Promise<void> {
    await prisma.loan.delete({
        where: { id: loanId }
    });
    revalidatePath('/');
}
