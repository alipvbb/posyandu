import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  getMasterData,
  listIndonesiaDistricts,
  listIndonesiaProvinces,
  listIndonesiaRegencies,
  listIndonesiaVillages,
} from './master-data.controller.js';

const router = Router();

router.use(authenticate);
router.get('/indonesia/provinces', listIndonesiaProvinces);
router.get('/indonesia/regencies/:provinceCode', listIndonesiaRegencies);
router.get('/indonesia/districts/:regencyCode', listIndonesiaDistricts);
router.get('/indonesia/villages/:districtCode', listIndonesiaVillages);
router.get('/', getMasterData);

export { router as masterDataRoutes };
