import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const passwordHash = await bcrypt.hash("Admin@2026", 12);
    const allSubjects = await db.subject.findMany({ select: { id: true } });

    // 1. Ensure Admin Account: akaitojnr@gmail.com / Admin@2026
    const adminUser = await db.user.upsert({
      where: { email: "akaitojnr@gmail.com" },
      update: { passwordHash, role: "ADMIN", isActive: true },
      create: {
        email: "akaitojnr@gmail.com",
        passwordHash,
        role: "ADMIN",
        isActive: true,
        admin: { create: { fullName: "Genius Academy Admin" } },
      },
      include: { admin: true },
    });

    if (!adminUser.admin) {
      await db.admin.create({
        data: { userId: adminUser.id, fullName: "Genius Academy Admin" },
      });
    }

    // 2. Clean up old akaitojnr+teacher@gmail.com if separate
    const oldTeacher = await db.user.findUnique({
      where: { email: "akaitojnr+teacher@gmail.com" },
      include: { teacher: true },
    });
    if (oldTeacher) {
      if (oldTeacher.teacher) {
        await db.teacher.delete({ where: { id: oldTeacher.teacher.id } }).catch(() => {});
      }
      await db.user.delete({ where: { id: oldTeacher.id } }).catch(() => {});
    }

    // 3. Ensure Teacher Account: shedrachmakama2@gmail.com / Admin@2026
    const teacherUser = await db.user.upsert({
      where: { email: "shedrachmakama2@gmail.com" },
      update: { passwordHash, role: "TEACHER", isActive: true },
      create: {
        email: "shedrachmakama2@gmail.com",
        passwordHash,
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

    if (teacherUser.teacher) {
      await db.teacher.update({
        where: { id: teacherUser.teacher.id },
        data: {
          fullName: "Mr. Shedrach Makama",
          subjects: { set: allSubjects.map((s) => ({ id: s.id })) },
        },
      });
      await db.course.updateMany({
        where: { teacherId: null },
        data: { teacherId: teacherUser.teacher.id },
      });
    }

    // 4. Ensure all student accounts are active
    await db.user.updateMany({
      where: { role: "STUDENT" },
      data: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      message: "Accounts repaired and synced successfully.",
      accounts: [
        { role: "ADMIN", email: "akaitojnr@gmail.com" },
        { role: "TEACHER", email: "shedrachmakama2@gmail.com", name: "Mr. Shedrach Makama" },
      ],
    });
  } catch (error: any) {
    console.error("Repair error:", error);
    return NextResponse.json({ error: error.message || "Failed to repair accounts" }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
