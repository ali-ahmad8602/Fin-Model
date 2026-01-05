"use server";

import { prisma } from "@/lib/prisma";
import { LoginCredentials, RegisterCredentials, User } from "@/types";
import { revalidatePath } from "next/cache";

export async function loginAction(credentials: LoginCredentials): Promise<User> {
    const user = await prisma.user.findUnique({
        where: { email: credentials.email },
    });

    if (!user || user.password !== credentials.password) {
        throw new Error("Invalid email or password");
    }

    // Return generic User type (excluding sensitive/ORM fields if needed, but strict casting for now)
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "ADMIN" | "VIEWER",
        password: user.password // Ideally assume handled securely, but maintaining simple types for now
    };
}

export async function registerAction(credentials: RegisterCredentials): Promise<User> {
    const existing = await prisma.user.findUnique({
        where: { email: credentials.email },
    });

    if (existing) {
        throw new Error("User already exists");
    }

    const user = await prisma.user.create({
        data: {
            email: credentials.email,
            password: credentials.password, // Plain text for demo; use bcrypt/argon2 in prod
            name: credentials.name,
            role: "ADMIN"
        }
    });

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "ADMIN" | "VIEWER",
        password: user.password
    };
}

export async function changePasswordAction(userId: string, oldPw: string, newPw: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    if (user.password !== oldPw) throw new Error("Incorrect current password");

    await prisma.user.update({
        where: { id: userId },
        data: { password: newPw }
    });
}
