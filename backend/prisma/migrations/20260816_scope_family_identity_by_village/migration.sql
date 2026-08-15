-- Allow families and identity numbers to be re-registered in another village
-- for real-world mutation/move-in cases, while keeping local village data clean.

ALTER TABLE `Family` DROP INDEX `Family_familyNumber_key`;
CREATE UNIQUE INDEX `Family_villageId_familyNumber_key` ON `Family`(`villageId`, `familyNumber`);

ALTER TABLE `FamilyMember` DROP INDEX `FamilyMember_nik_key`;
CREATE UNIQUE INDEX `FamilyMember_familyId_nik_key` ON `FamilyMember`(`familyId`, `nik`);

ALTER TABLE `Mother` DROP INDEX `Mother_nik_key`;
CREATE UNIQUE INDEX `Mother_familyId_nik_key` ON `Mother`(`familyId`, `nik`);

ALTER TABLE `Father` DROP INDEX `Father_nik_key`;
CREATE UNIQUE INDEX `Father_familyId_nik_key` ON `Father`(`familyId`, `nik`);

ALTER TABLE `Toddler` DROP INDEX `Toddler_nik_key`;
CREATE UNIQUE INDEX `Toddler_familyId_nik_key` ON `Toddler`(`familyId`, `nik`);
