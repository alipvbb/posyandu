import { Router } from 'express';
import { APP_SHORT_NAME } from '../config/app-meta.js';
import { auditRoutes } from '../modules/audit/audit.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { balitaRoutes } from '../modules/balita/balita.routes.js';
import { cardsRoutes } from '../modules/cards/cards.routes.js';
import { checkupsRoutes } from '../modules/checkups/checkups.routes.js';
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes.js';
import { familiesRoutes } from '../modules/families/families.routes.js';
import { masterDataRoutes } from '../modules/master-data/master-data.routes.js';
import { permissionsRoutes } from '../modules/permissions/permissions.routes.js';
import { posyanduRoutes } from '../modules/posyandu/posyandu.routes.js';
import { qrcodeRoutes } from '../modules/qrcode/qrcode.routes.js';
import { reportsRoutes } from '../modules/reports/reports.routes.js';
import { rolesRoutes } from '../modules/roles/roles.routes.js';
import { scanRoutes } from '../modules/scan/scan.routes.js';
import { usersRoutes } from '../modules/users/users.routes.js';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    message: `API ${APP_SHORT_NAME} aktif`,
    endpoints: {
      health: '/health',
      register: '/api/auth/register',
      verifyRegister: '/api/auth/verify-register',
      resendRegisterCode: '/api/auth/resend-register-code',
      login: '/api/auth/login',
      forgotPassword: '/api/auth/forgot-password',
      resetPassword: '/api/auth/reset-password',
      me: '/api/auth/me',
      toddlers: '/api/toddlers',
      dashboard: '/api/dashboard/summary',
      reports: '/api/reports/toddlers',
      publicCard: '/api/cards/public/:token',
    },
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/roles', rolesRoutes);
apiRouter.use('/permissions', permissionsRoutes);
apiRouter.use('/toddlers', balitaRoutes);
apiRouter.use('/', checkupsRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/reports', reportsRoutes);
apiRouter.use('/qrcode', qrcodeRoutes);
apiRouter.use('/cards', cardsRoutes);
apiRouter.use('/scan', scanRoutes);
apiRouter.use('/master-data', masterDataRoutes);
apiRouter.use('/posyandu', posyanduRoutes);
apiRouter.use('/families', familiesRoutes);
apiRouter.use('/audit-logs', auditRoutes);
