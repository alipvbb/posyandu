-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    UNIQUE INDEX `Role_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Permission_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `roleId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRole` (
    `userId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Village` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Village_code_key`(`code`),
    INDEX `Village_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Hamlet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `villageId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Hamlet_code_key`(`code`),
    INDEX `Hamlet_villageId_idx`(`villageId`),
    INDEX `Hamlet_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RW` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hamletId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RW_code_key`(`code`),
    INDEX `RW_hamletId_idx`(`hamletId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RT` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rwId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RT_code_key`(`code`),
    INDEX `RT_rwId_idx`(`rwId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Posyandu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `villageId` INTEGER NOT NULL,
    `hamletId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `locationAddress` VARCHAR(191) NULL,
    `scheduleDay` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Posyandu_code_key`(`code`),
    INDEX `Posyandu_villageId_hamletId_idx`(`villageId`, `hamletId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Family` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `villageId` INTEGER NOT NULL,
    `hamletId` INTEGER NOT NULL,
    `rwId` INTEGER NOT NULL,
    `rtId` INTEGER NOT NULL,
    `familyNumber` VARCHAR(191) NOT NULL,
    `headName` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Family_familyNumber_key`(`familyNumber`),
    INDEX `Family_hamletId_rwId_rtId_idx`(`hamletId`, `rwId`, `rtId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mother` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `familyId` INTEGER NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `nik` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `education` VARCHAR(191) NULL,
    `occupation` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Mother_nik_key`(`nik`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Father` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `familyId` INTEGER NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `nik` VARCHAR(191) NULL,
    `birthDate` DATETIME(3) NULL,
    `education` VARCHAR(191) NULL,
    `occupation` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Father_nik_key`(`nik`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Toddler` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `nik` VARCHAR(191) NULL,
    `noKk` VARCHAR(191) NULL,
    `placeOfBirth` VARCHAR(191) NOT NULL,
    `birthDate` DATETIME(3) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE') NOT NULL,
    `motherName` VARCHAR(191) NOT NULL,
    `fatherName` VARCHAR(191) NOT NULL,
    `familyId` INTEGER NOT NULL,
    `posyanduId` INTEGER NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `hamletId` INTEGER NOT NULL,
    `rwId` INTEGER NOT NULL,
    `rtId` INTEGER NOT NULL,
    `parentPhone` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `qrCodeValue` VARCHAR(191) NOT NULL,
    `photoUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Toddler_code_key`(`code`),
    UNIQUE INDEX `Toddler_nik_key`(`nik`),
    UNIQUE INDEX `Toddler_qrCodeValue_key`(`qrCodeValue`),
    INDEX `Toddler_fullName_idx`(`fullName`),
    INDEX `Toddler_hamletId_posyanduId_idx`(`hamletId`, `posyanduId`),
    INDEX `Toddler_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ToddlerCard` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `toddlerId` INTEGER NOT NULL,
    `cardNumber` VARCHAR(191) NOT NULL,
    `publicToken` VARCHAR(191) NOT NULL,
    `qrCodeUrl` VARCHAR(191) NULL,
    `printedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ToddlerCard_cardNumber_key`(`cardNumber`),
    UNIQUE INDEX `ToddlerCard_publicToken_key`(`publicToken`),
    INDEX `ToddlerCard_toddlerId_idx`(`toddlerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InterventionType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InterventionType_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Checkup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `toddlerId` INTEGER NOT NULL,
    `posyanduId` INTEGER NOT NULL,
    `createdById` INTEGER NULL,
    `examDate` DATETIME(3) NOT NULL,
    `ageInMonths` INTEGER NOT NULL,
    `weight` DECIMAL(5, 2) NOT NULL,
    `height` DECIMAL(5, 2) NOT NULL,
    `headCircumference` DECIMAL(5, 2) NULL,
    `muac` DECIMAL(5, 2) NULL,
    `immunizationNote` VARCHAR(191) NULL,
    `vitaminPmtNote` VARCHAR(191) NULL,
    `complaintNote` VARCHAR(191) NULL,
    `officerName` VARCHAR(191) NOT NULL,
    `growthTrend` ENUM('UP', 'STABLE', 'DOWN') NOT NULL,
    `riskLevel` ENUM('NORMAL', 'ATTENTION', 'STUNTING_RISK', 'UNDERNUTRITION') NOT NULL,
    `statusLabel` VARCHAR(191) NOT NULL,
    `growthSummary` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Checkup_toddlerId_examDate_idx`(`toddlerId`, `examDate` DESC),
    INDEX `Checkup_riskLevel_idx`(`riskLevel`),
    INDEX `Checkup_posyanduId_examDate_idx`(`posyanduId`, `examDate` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CheckupIntervention` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `checkupId` INTEGER NOT NULL,
    `interventionTypeId` INTEGER NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CheckupIntervention_checkupId_idx`(`checkupId`),
    INDEX `CheckupIntervention_interventionTypeId_idx`(`interventionTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Immunization` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `recommendedAtMonth` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Immunization_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ToddlerImmunization` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `toddlerId` INTEGER NOT NULL,
    `immunizationId` INTEGER NOT NULL,
    `checkupId` INTEGER NULL,
    `administeredAt` DATETIME(3) NOT NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `ToddlerImmunization_toddlerId_administeredAt_idx`(`toddlerId`, `administeredAt` DESC),
    INDEX `ToddlerImmunization_immunizationId_idx`(`immunizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GrowthStatusLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `toddlerId` INTEGER NOT NULL,
    `checkupId` INTEGER NOT NULL,
    `previousCheckupId` INTEGER NULL,
    `ageInMonths` INTEGER NOT NULL,
    `trend` ENUM('UP', 'STABLE', 'DOWN') NOT NULL,
    `riskLevel` ENUM('NORMAL', 'ATTENTION', 'STUNTING_RISK', 'UNDERNUTRITION') NOT NULL,
    `weightDelta` DECIMAL(5, 2) NULL,
    `weightGap` DECIMAL(5, 2) NULL,
    `heightGap` DECIMAL(5, 2) NULL,
    `note` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GrowthStatusLog_toddlerId_createdAt_idx`(`toddlerId`, `createdAt` DESC),
    INDEX `GrowthStatusLog_riskLevel_idx`(`riskLevel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_action_createdAt_idx`(`action`, `createdAt` DESC),
    INDEX `AuditLog_userId_createdAt_idx`(`userId`, `createdAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Hamlet` ADD CONSTRAINT `Hamlet_villageId_fkey` FOREIGN KEY (`villageId`) REFERENCES `Village`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RW` ADD CONSTRAINT `RW_hamletId_fkey` FOREIGN KEY (`hamletId`) REFERENCES `Hamlet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RT` ADD CONSTRAINT `RT_rwId_fkey` FOREIGN KEY (`rwId`) REFERENCES `RW`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Posyandu` ADD CONSTRAINT `Posyandu_villageId_fkey` FOREIGN KEY (`villageId`) REFERENCES `Village`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Posyandu` ADD CONSTRAINT `Posyandu_hamletId_fkey` FOREIGN KEY (`hamletId`) REFERENCES `Hamlet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Family` ADD CONSTRAINT `Family_villageId_fkey` FOREIGN KEY (`villageId`) REFERENCES `Village`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Family` ADD CONSTRAINT `Family_hamletId_fkey` FOREIGN KEY (`hamletId`) REFERENCES `Hamlet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Family` ADD CONSTRAINT `Family_rwId_fkey` FOREIGN KEY (`rwId`) REFERENCES `RW`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Family` ADD CONSTRAINT `Family_rtId_fkey` FOREIGN KEY (`rtId`) REFERENCES `RT`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mother` ADD CONSTRAINT `Mother_familyId_fkey` FOREIGN KEY (`familyId`) REFERENCES `Family`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Father` ADD CONSTRAINT `Father_familyId_fkey` FOREIGN KEY (`familyId`) REFERENCES `Family`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Toddler` ADD CONSTRAINT `Toddler_familyId_fkey` FOREIGN KEY (`familyId`) REFERENCES `Family`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Toddler` ADD CONSTRAINT `Toddler_posyanduId_fkey` FOREIGN KEY (`posyanduId`) REFERENCES `Posyandu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Toddler` ADD CONSTRAINT `Toddler_hamletId_fkey` FOREIGN KEY (`hamletId`) REFERENCES `Hamlet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Toddler` ADD CONSTRAINT `Toddler_rwId_fkey` FOREIGN KEY (`rwId`) REFERENCES `RW`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Toddler` ADD CONSTRAINT `Toddler_rtId_fkey` FOREIGN KEY (`rtId`) REFERENCES `RT`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ToddlerCard` ADD CONSTRAINT `ToddlerCard_toddlerId_fkey` FOREIGN KEY (`toddlerId`) REFERENCES `Toddler`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Checkup` ADD CONSTRAINT `Checkup_toddlerId_fkey` FOREIGN KEY (`toddlerId`) REFERENCES `Toddler`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Checkup` ADD CONSTRAINT `Checkup_posyanduId_fkey` FOREIGN KEY (`posyanduId`) REFERENCES `Posyandu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Checkup` ADD CONSTRAINT `Checkup_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CheckupIntervention` ADD CONSTRAINT `CheckupIntervention_checkupId_fkey` FOREIGN KEY (`checkupId`) REFERENCES `Checkup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CheckupIntervention` ADD CONSTRAINT `CheckupIntervention_interventionTypeId_fkey` FOREIGN KEY (`interventionTypeId`) REFERENCES `InterventionType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ToddlerImmunization` ADD CONSTRAINT `ToddlerImmunization_toddlerId_fkey` FOREIGN KEY (`toddlerId`) REFERENCES `Toddler`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ToddlerImmunization` ADD CONSTRAINT `ToddlerImmunization_immunizationId_fkey` FOREIGN KEY (`immunizationId`) REFERENCES `Immunization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ToddlerImmunization` ADD CONSTRAINT `ToddlerImmunization_checkupId_fkey` FOREIGN KEY (`checkupId`) REFERENCES `Checkup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GrowthStatusLog` ADD CONSTRAINT `GrowthStatusLog_toddlerId_fkey` FOREIGN KEY (`toddlerId`) REFERENCES `Toddler`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GrowthStatusLog` ADD CONSTRAINT `GrowthStatusLog_checkupId_fkey` FOREIGN KEY (`checkupId`) REFERENCES `Checkup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

