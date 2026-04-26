ALTER TABLE `Family`
  ADD COLUMN `domicileProvinceCode` VARCHAR(16) NULL,
  ADD COLUMN `domicileProvinceName` VARCHAR(191) NULL,
  ADD COLUMN `domicileRegencyCode` VARCHAR(16) NULL,
  ADD COLUMN `domicileRegencyName` VARCHAR(191) NULL,
  ADD COLUMN `domicileDistrictCode` VARCHAR(16) NULL,
  ADD COLUMN `domicileDistrictName` VARCHAR(191) NULL,
  ADD COLUMN `domicileVillageCode` VARCHAR(16) NULL,
  ADD COLUMN `domicileVillageName` VARCHAR(191) NULL;

CREATE INDEX `Family_domicileProvinceCode_idx` ON `Family`(`domicileProvinceCode`);
CREATE INDEX `Family_domicileRegencyCode_idx` ON `Family`(`domicileRegencyCode`);
CREATE INDEX `Family_domicileDistrictCode_idx` ON `Family`(`domicileDistrictCode`);
CREATE INDEX `Family_domicileVillageCode_idx` ON `Family`(`domicileVillageCode`);
