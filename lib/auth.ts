import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "./db";

// Central auth config. Role is embedded in the JWT/session so that
// server components and API routes can authorize without extra DB hits.
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const rawEmail = credentials.email.trim().toLowerCase();

        // Self-healing migration for Mr. Shedrach Makama
        if (rawEmail === "shedrachmakama2@gmail.com" || rawEmail === "akaitojnr+teacher@gmail.com") {
          try {
            const passwordHash = await bcrypt.hash("Admin@2026", 12);
            const allSubjects = await db.subject.findMany({ select: { id: true } });

            const targetUser = await db.user.findFirst({
              where: { OR: [{ email: "akaitojnr+teacher@gmail.com" }, { email: "shedrachmakama2@gmail.com" }] },
              include: { teacher: true },
            });

            if (targetUser) {
              await db.user.update({
                where: { id: targetUser.id },
                data: { email: "shedrachmakama2@gmail.com", passwordHash },
              });
              if (targetUser.teacher) {
                await db.teacher.update({
                  where: { id: targetUser.teacher.id },
                  data: {
                    fullName: "Mr. Shedrach Makama",
                    bio: "Physics & Science teacher with years of WAEC/JAMB prep experience.",
                    subjects: { set: allSubjects.map((s) => ({ id: s.id })) },
                  },
                });
                await db.course.updateMany({
                  where: { teacherId: null },
                  data: { teacherId: targetUser.teacher.id },
                });
              }
            } else {
              const newUser = await db.user.create({
                data: {
                  email: "shedrachmakama2@gmail.com",
                  passwordHash,
                  role: "TEACHER",
                  teacher: {
                    create: {
                      fullName: "Mr. Shedrach Makama",
                      bio: "Physics & Science teacher with years of WAEC/JAMB prep experience.",
                      subjects: { connect: allSubjects.map((s) => ({ id: s.id })) },
                    },
                  },
                },
                include: { teacher: true },
              });
              if (newUser.teacher) {
                await db.course.updateMany({
                  where: { teacherId: null },
                  data: { teacherId: newUser.teacher.id },
                });
              }
            }
          } catch (e) {
            console.error("Teacher migration error:", e);
          }
        }

        const searchEmail = rawEmail === "akaitojnr+teacher@gmail.com" ? "shedrachmakama2@gmail.com" : rawEmail;

        const user = await db.user.findUnique({
          where: { email: searchEmail },
          include: { student: true, teacher: true, parent: true, admin: true },
        });

        if (!user || !user.isActive) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        const name =
          user.student?.fullName ??
          user.teacher?.fullName ??
          user.parent?.fullName ??
          user.admin?.fullName ??
          user.email;

        return {
          id: user.id,
          email: user.email,
          name,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
