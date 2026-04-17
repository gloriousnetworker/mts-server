import { prisma } from '../../config/database.js';
import { hashPassword } from '../../utils/password.js';
import { ApiError } from '../../utils/api-error.js';
import type { CreateStaffInput } from './staff.schema.js';

// Transforms User + StaffProfile into the frontend Staff type
function formatStaff(user: any) {
  const profile = user.staffProfile;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    position: profile?.position ?? '',
    bio: profile?.bio ?? '',
    photo: profile?.photo ?? user.avatar ?? '',
    skills: profile?.skills ?? [],
    social: profile?.social ?? null,
    createdAt: user.createdAt,
  };
}

export async function listStaff() {
  const staff = await prisma.user.findMany({
    where: { role: 'staff' },
    include: { staffProfile: true },
    orderBy: { createdAt: 'desc' },
  });
  return staff.map(formatStaff);
}

export async function createStaff(input: CreateStaffInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict('Email already registered');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
      role: 'staff',
      staffProfile: {
        create: {
          position: input.position,
          bio: input.bio ?? '',
          photo: input.photo ?? '',
          skills: input.skills ?? [],
          social: input.social ?? undefined,
        },
      },
    },
    include: { staffProfile: true },
  });

  return formatStaff(user);
}

export async function updateStaff(id: string, input: Partial<CreateStaffInput>) {
  const user = await prisma.user.findUnique({ where: { id }, include: { staffProfile: true } });
  if (!user || user.role !== 'staff') {
    throw ApiError.notFound('Staff member not found');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: input.name ?? user.name,
      email: input.email ?? user.email,
      phone: input.phone ?? user.phone,
      staffProfile: {
        update: {
          position: input.position,
          bio: input.bio,
          photo: input.photo,
          skills: input.skills,
          social: input.social ?? undefined,
        },
      },
    },
    include: { staffProfile: true },
  });

  return formatStaff(updated);
}

export async function deleteStaff(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== 'staff') {
    throw ApiError.notFound('Staff member not found');
  }

  await prisma.course.updateMany({ where: { instructorId: id }, data: { instructorId: id } });
  await prisma.staffProfile.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
}
