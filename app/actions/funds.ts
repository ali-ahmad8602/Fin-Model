"use server";

import { prisma } from "@/lib/prisma";
import { Fund } from "@/types";
import { revalidatePath } from "next/cache";

export async function getFundsAction(): Promise<Fund[]> {
    const funds = await prisma.fund.findMany({
        orderBy: { createdAt: 'desc' }
    });
    return funds.map(f => ({
        id: f.id,
        name: f.name,
        totalRaised: f.totalRaised,
        costOfCapitalRate: f.costOfCapitalRate
    }));
}

export async function addFundAction(data: Omit<Fund, 'id'>): Promise<Fund> {
    const fund = await prisma.fund.create({
        data: {
            name: data.name,
            totalRaised: data.totalRaised,
            costOfCapitalRate: data.costOfCapitalRate
        }
    });
    revalidatePath('/');
    return fund;
}
