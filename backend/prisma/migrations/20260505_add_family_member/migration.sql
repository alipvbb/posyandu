CREATE TABLE IF NOT EXISTS `FamilyMember` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `familyId` INTEGER NOT NULL,
  `relationType` VARCHAR(191) NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `nik` VARCHAR(191) NULL,
  `gender` ENUM('MALE', 'FEMALE') NOT NULL,
  `placeOfBirth` VARCHAR(191) NULL,
  `birthDate` DATETIME(3) NULL,
  `religion` VARCHAR(191) NULL,
  `education` VARCHAR(191) NULL,
  `occupation` VARCHAR(191) NULL,
  `maritalStatus` VARCHAR(191) NULL,
  `citizenship` VARCHAR(191) NULL DEFAULT 'WNI',
  `fatherName` VARCHAR(191) NULL,
  `motherName` VARCHAR(191) NULL,
  `relationshipStatus` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `FamilyMember_nik_key`(`nik`),
  INDEX `FamilyMember_familyId_idx`(`familyId`),
  INDEX `FamilyMember_relationType_idx`(`relationType`),
  INDEX `FamilyMember_fullName_idx`(`fullName`),
  CONSTRAINT `FamilyMember_familyId_fkey`
    FOREIGN KEY (`familyId`) REFERENCES `Family`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
