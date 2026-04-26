ALTER TABLE `User`
  ADD COLUMN `useCustomPermissions` BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE `UserPermission` (
  `userId` INTEGER NOT NULL,
  `permissionId` INTEGER NOT NULL,
  `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`userId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserPermission`
  ADD CONSTRAINT `UserPermission_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UserPermission`
  ADD CONSTRAINT `UserPermission_permissionId_fkey`
  FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
