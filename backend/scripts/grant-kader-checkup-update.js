import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roleCode = 'kader-posyandu';
  const permissionCode = 'checkups.update';

  const [role, permission] = await Promise.all([
    prisma.role.findUnique({ where: { code: roleCode } }),
    prisma.permission.findUnique({ where: { code: permissionCode } }),
  ]);

  if (!role) {
    throw new Error(`Role '${roleCode}' tidak ditemukan`);
  }
  if (!permission) {
    throw new Error(`Permission '${permissionCode}' tidak ditemukan`);
  }

  const existing = await prisma.rolePermission.findFirst({
    where: {
      roleId: role.id,
      permissionId: permission.id,
    },
  });

  if (existing) {
    console.log('Permission sudah ada untuk role Kader Posyandu.');
    return;
  }

  await prisma.rolePermission.create({
    data: {
      roleId: role.id,
      permissionId: permission.id,
    },
  });

  console.log("Berhasil menambahkan permission 'checkups.update' ke role 'kader-posyandu'.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

