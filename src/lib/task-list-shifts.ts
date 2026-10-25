import { prisma } from "@/lib/db";

export const shiftSelect = { id: true, name: true, code: true, startTime: true, endTime: true, color: true };

/** Prisma `include` that loads a task list's linked shifts. */
export const listShiftsInclude = {
  shiftLinks: { include: { shift: { select: shiftSelect } } },
} as const;

type ListWithLinks = {
  shiftLinks: { shiftId: string; shift: { id: string; name: string; code: string; startTime: string; endTime: string; color: string } }[];
};

/** Flatten shiftLinks into `shifts` / `shiftIds` for API responses. */
export function withShifts<T extends ListWithLinks>({ shiftLinks, ...list }: T) {
  return {
    ...list,
    shifts: shiftLinks.map((l) => l.shift),
    shiftIds: shiftLinks.map((l) => l.shiftId),
  };
}

/**
 * Apply link changes to a task list:
 * - shiftIds replaces the whole set
 * - addShiftId / removeShiftId change a single link (used by the shift editor,
 *   so it never clobbers links owned by other shifts)
 */
export async function applyShiftLinks(
  taskListId: string,
  opts: { shiftIds?: string[]; addShiftId?: string; removeShiftId?: string }
) {
  if (Array.isArray(opts.shiftIds)) {
    const wanted = Array.from(new Set(opts.shiftIds.filter(Boolean)));
    await prisma.$transaction([
      prisma.taskListShift.deleteMany({ where: { taskListId, shiftId: { notIn: wanted } } }),
      ...wanted.map((shiftId) =>
        prisma.taskListShift.upsert({
          where: { taskListId_shiftId: { taskListId, shiftId } },
          create: { taskListId, shiftId },
          update: {},
        })
      ),
    ]);
  }
  if (opts.addShiftId) {
    await prisma.taskListShift.upsert({
      where: { taskListId_shiftId: { taskListId, shiftId: opts.addShiftId } },
      create: { taskListId, shiftId: opts.addShiftId },
      update: {},
    });
  }
  if (opts.removeShiftId) {
    await prisma.taskListShift.deleteMany({ where: { taskListId, shiftId: opts.removeShiftId } });
  }
}
