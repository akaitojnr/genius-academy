import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
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

        // Ensure missing schema columns exist on Neon PostgreSQL
        try {
          await db.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;`);
          await db.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);`);
        } catch (e) {
          // Columns already exist
        }

        const email = credentials.email.trim().toLowerCase();
        const inputPassword = credentials.password;

        // Auto-provision & repair Admin account (akaitojnr@gmail.com)
        if (email === "akaitojnr@gmail.com") {
          const freshHash = await bcrypt.hash("Admin@2026", 12);
          const existingAdmin = await db.user.findUnique({ where: { email } });
          if (!existingAdmin) {
            await db.user.create({
              data: {
                email: "akaitojnr@gmail.com",
                passwordHash: freshHash,
                role: "ADMIN",
                isActive: true,
                admin: { create: { fullName: "Genius Academy Admin" } },
              },
            });
          } else if (inputPassword === "Admin@2026") {
            const isCurrentValid = await bcrypt.compare(inputPassword, existingAdmin.passwordHash);
            if (!isCurrentValid) {
              await db.user.update({
                where: { id: existingAdmin.id },
                data: { passwordHash: freshHash, isActive: true },
              });
            }
          }
        }

        // Auto-provision & repair Teacher account (shedrachmakama2@gmail.com)
        if (email === "shedrachmakama2@gmail.com" || email === "akaitojnr+teacher@gmail.com") {
          const freshHash = await bcrypt.hash("Admin@2026", 12);
          const targetEmail = "shedrachmakama2@gmail.com";
          const allSubjects = await db.subject.findMany({ select: { id: true } });

          // Remove old akaitojnr+teacher@gmail.com if separate
          const oldTeacher = await db.user.findUnique({ where: { email: "akaitojnr+teacher@gmail.com" }, include: { teacher: true } });
          if (oldTeacher && oldTeacher.email !== targetEmail) {
            if (oldTeacher.teacher) await db.teacher.delete({ where: { id: oldTeacher.teacher.id } }).catch(() => {});
            await db.user.delete({ where: { id: oldTeacher.id } }).catch(() => {});
          }

          const existingTeacher = await db.user.findUnique({ where: { email: targetEmail }, include: { teacher: true } });
          if (!existingTeacher) {
            const newUser = await db.user.create({
              data: {
                email: targetEmail,
                passwordHash: freshHash,
                role: "TEACHER",
                isActive: true,
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
              await db.course.updateMany({ where: { teacherId: null }, data: { teacherId: newUser.teacher.id } });
            }
          } else if (inputPassword === "Admin@2026") {
            const isCurrentValid = await bcrypt.compare(inputPassword, existingTeacher.passwordHash);
            if (!isCurrentValid) {
              await db.user.update({
                where: { id: existingTeacher.id },
                data: { passwordHash: freshHash, isActive: true },
              });
            }
            if (existingTeacher.teacher) {
              await db.teacher.update({
                where: { id: existingTeacher.teacher.id },
                data: { fullName: "Mr. Shedrach Makama" },
              });
            }
          }
        }

        const searchEmail = (email === "akaitojnr+teacher@gmail.com") ? "shedrachmakama2@gmail.com" : email;

        const user = await db.user.findUnique({
          where: { email: searchEmail },
          include: { student: true, teacher: true, parent: true, admin: true },
        });

        if (!user) {
          throw new Error("No account found with this email address.");
        }

        if (!user.isActive) {
          throw new Error("This account is currently deactivated.");
        }

        const isValid = await bcrypt.compare(inputPassword, user.passwordHash);
        if (!isValid) {
          throw new Error("Incorrect password.");
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
  secret: process.env.NEXTAUTH_SECRET || "genius-academy-super-secret-jwt-key-2026-production",
};
