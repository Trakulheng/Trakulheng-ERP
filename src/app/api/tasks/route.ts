import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const assignee = req.nextUrl.searchParams.get("assignee");

    const tasks = await prisma.task.findMany({
      where: {
        ...(status && status !== "all" ? { status } : {}),
        ...(assignee ? { assigneeName: { contains: assignee, mode: "insensitive" } } : {}),
      },
      orderBy: [
        { dueDate: "asc" },
        { dueTime: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(tasks);
  } catch (err) {
    console.error("[tasks GET]", err);
    return NextResponse.json({ error: "Failed to load tasks." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, dueDate, dueTime, priority, assigneeName, shiftLabel } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        priority: priority || "medium",
        assigneeName: assigneeName?.trim() || null,
        shiftLabel: shiftLabel?.trim() || null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("[tasks POST]", err);
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
  }
}
