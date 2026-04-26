ALTER TABLE `User`
  ADD COLUMN `villageId` INTEGER NULL;

CREATE INDEX `User_villageId_idx` ON `User`(`villageId`);

ALTER TABLE `User`
  ADD CONSTRAINT `User_villageId_fkey`
  FOREIGN KEY (`villageId`) REFERENCES `Village`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `UserVerificationCode` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `codeHash` VARCHAR(191) NOT NULL,
  `purpose` VARCHAR(191) NOT NULL DEFAULT 'REGISTER',
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `UserVerificationCode_userId_purpose_createdAt_idx`
  ON `UserVerificationCode`(`userId`, `purpose`, `createdAt`);

CREATE INDEX `UserVerificationCode_expiresAt_idx`
  ON `UserVerificationCode`(`expiresAt`);

ALTER TABLE `UserVerificationCode`
  ADD CONSTRAINT `UserVerificationCode_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
