import { prisma } from '../../config/prisma.js';
import dayjs from 'dayjs';
import { writeAuditLog } from '../../services/audit.service.js';
import { calculateAgeInMonths, evaluateGrowthStatus } from '../../services/growth.service.js';
import { ApiError } from '../../utils/api-error.js';
import { ensureVillageAccess, getActorVillageId } from '../../utils/village-scope.js';
import { mapCheckup } from '../balita/balita.shared.js';

const createGrowthLog = (result, toddlerId, checkupId, previousCheckupId = null) => ({
  toddlerId,
  checkupId,
  previousCheckupId,
  ageInMonths: result.ageInMonths,
  trend: result.trend,
  riskLevel: result.riskLevel,
  weightDelta: result.weightDelta,
  weightGap: result.weightGap,
  heightGap: result.heightGap,
  note: result.summary,
});

const ensurePosyanduVillageAccess = async (reqUser, posyanduId) => {
  const actorVillageId = getActorVillageId(reqUser);
  if (actorVillageId === null || !posyanduId) return;
  const posyandu = await prisma.posyandu.findUnique({
    where: { id: Number(posyanduId) },
    select: { villageId: true },
  });
  if (!posyandu) throw new ApiError(400, 'Posyandu tidak ditemukan');
  ensureVillageAccess(reqUser, posyandu.villageId, 'Anda hanya dapat memilih posyandu pada desa Anda');
};

export const listToddlerCheckups = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const toddlerId = Number(req.params.id);
    const toddler = await prisma.toddler.findUnique({
      where: { id: toddlerId },
      select: { id: true, gender: true, family: { select: { villageId: true } } },
    });
    if (!toddler) throw new ApiError(404, 'Balita tidak ditemukan');
    if (actorVillageId !== null) {
      ensureVillageAccess(req.user, toddler.family?.villageId, 'Anda hanya dapat melihat pemeriksaan pada desa Anda');
    }

    const checkups = await prisma.checkup.findMany({
      where: { toddlerId },
      orderBy: { examDate: 'desc' },
      include: {
        interventions: {
          include: {
            interventionType: true,
          },
        },
        immunizations: {
          include: {
            immunization: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: checkups.map((checkup) => ({
        ...mapCheckup(checkup, toddler.gender),
        interventions: checkup.interventions,
        immunizations: checkup.immunizations,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyCheckupOverview = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const fallbackFromDate = req.query.date ? dayjs(String(req.query.date)) : null;
    const requestedMonth = req.query.month
      ? dayjs(`${String(req.query.month)}-01`)
      : (fallbackFromDate?.isValid() ? fallbackFromDate : dayjs());
    const target = requestedMonth.isValid() ? requestedMonth : dayjs();
    const start = target.startOf('month').toDate();
    const end = target.endOf('month').toDate();
    const monthLabel = target.format('YYYY-MM');

    const [activeToddlers, checkupsAtMonthRaw] = await Promise.all([
      prisma.toddler.findMany({
        where: {
          status: 'ACTIVE',
          ...(actorVillageId === null ? {} : { family: { is: { villageId: actorVillageId } } }),
        },
        include: {
          hamlet: true,
          rw: true,
          rt: true,
          posyandu: true,
          checkups: {
            orderBy: { examDate: 'desc' },
            take: 1,
          },
        },
        orderBy: { fullName: 'asc' },
      }),
      prisma.checkup.findMany({
        where: {
          examDate: {
            gte: start,
            lte: end,
          },
          toddler: {
            status: 'ACTIVE',
            ...(actorVillageId === null ? {} : { family: { is: { villageId: actorVillageId } } }),
          },
        },
        include: {
          toddler: {
            include: {
              hamlet: true,
              rw: true,
              rt: true,
              posyandu: true,
            },
          },
        },
        orderBy: [{ examDate: 'desc' }, { id: 'desc' }],
      }),
    ]);

    const latestCheckupByToddler = new Map();
    for (const checkup of checkupsAtMonthRaw) {
      if (!latestCheckupByToddler.has(checkup.toddlerId)) {
        latestCheckupByToddler.set(checkup.toddlerId, checkup);
      }
    }
    const checkupsAtMonth = [...latestCheckupByToddler.values()];

    const checkedIds = new Set(checkupsAtMonth.map((item) => item.toddlerId));
    const presentToddlers = checkupsAtMonth.map((item) => ({
      toddlerId: item.toddlerId,
      checkupId: item.id,
      fullName: item.toddler.fullName,
      code: item.toddler.code,
      hamlet: item.toddler.hamlet?.name || '-',
      rw: item.toddler.rw?.name || '-',
      rt: item.toddler.rt?.name || '-',
      posyandu: item.toddler.posyandu?.name || '-',
      parentPhone: item.toddler.parentPhone || null,
      examDate: item.examDate,
      officerName: item.officerName,
      riskLevel: item.riskLevel,
      statusLabel: item.statusLabel,
    }));

    const riskPriority = {
      STUNTING_RISK: 1,
      UNDERNUTRITION: 2,
      ATTENTION: 3,
      OVERWEIGHT: 4,
      NORMAL: 5,
      UNKNOWN: 6,
    };

    const absentToddlers = activeToddlers
      .filter((item) => !checkedIds.has(item.id))
      .sort((a, b) => {
        const riskA = riskPriority[a.checkups[0]?.riskLevel || 'UNKNOWN'] || riskPriority.UNKNOWN;
        const riskB = riskPriority[b.checkups[0]?.riskLevel || 'UNKNOWN'] || riskPriority.UNKNOWN;
        if (riskA !== riskB) return riskA - riskB;
        const lastExamA = a.checkups[0]?.examDate ? dayjs(a.checkups[0].examDate).valueOf() : 0;
        const lastExamB = b.checkups[0]?.examDate ? dayjs(b.checkups[0].examDate).valueOf() : 0;
        return lastExamA - lastExamB;
      })
      .map((item) => ({
        toddlerId: item.id,
        fullName: item.fullName,
        code: item.code,
        hamlet: item.hamlet?.name || '-',
        rw: item.rw?.name || '-',
        rt: item.rt?.name || '-',
        posyandu: item.posyandu?.name || '-',
        parentPhone: item.parentPhone || null,
        latestRisk: item.checkups[0]?.riskLevel || null,
        latestStatus: item.checkups[0]?.statusLabel || null,
        lastExamDate: item.checkups[0]?.examDate || null,
      }));

    const totalActive = activeToddlers.length;
    const presentCount = presentToddlers.length;
    const absentCount = absentToddlers.length;

    res.json({
      success: true,
      data: {
        month: monthLabel,
        summary: {
          totalActive,
          presentCount,
          absentCount,
          presentPercent: totalActive ? Math.round((presentCount / totalActive) * 100) : 0,
          absentPercent: totalActive ? Math.round((absentCount / totalActive) * 100) : 0,
        },
        presentToddlers,
        absentToddlers,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCheckup = async (req, res, next) => {
  try {
    const toddlerId = req.validated.params.id;
    const payload = req.validated.body;
    const toddler = await prisma.toddler.findUnique({
      where: { id: toddlerId },
      include: { family: { select: { villageId: true } } },
    });
    if (!toddler) throw new ApiError(404, 'Balita tidak ditemukan');
    ensureVillageAccess(req.user, toddler.family?.villageId, 'Anda hanya dapat input pemeriksaan pada desa Anda');
    await ensurePosyanduVillageAccess(req.user, payload.posyanduId);

    const previousCheckup = await prisma.checkup.findFirst({
      where: { toddlerId },
      orderBy: { examDate: 'desc' },
    });

    const ageInMonths = payload.ageInMonths ?? calculateAgeInMonths(toddler.birthDate, payload.examDate);
    const evaluation = evaluateGrowthStatus({
      toddler,
      currentCheckup: { ...payload, ageInMonths },
      previousCheckup,
    });

    const created = await prisma.$transaction(async (tx) => {
      const checkup = await tx.checkup.create({
        data: {
          toddlerId,
          posyanduId: payload.posyanduId,
          createdById: req.user.id,
          examDate: payload.examDate,
          ageInMonths: evaluation.ageInMonths,
          weight: payload.weight,
          height: payload.height,
          headCircumference: payload.headCircumference,
          muac: payload.muac,
          immunizationNote: payload.immunizationNote,
          vitaminPmtNote: payload.vitaminPmtNote,
          complaintNote: payload.complaintNote,
          officerName: payload.officerName,
          growthTrend: evaluation.trend,
          riskLevel: evaluation.riskLevel,
          statusLabel: evaluation.statusLabel,
          growthSummary: evaluation.summary,
          interventions: payload.interventionTypeIds?.length
            ? {
                create: payload.interventionTypeIds.map((interventionTypeId) => ({ interventionTypeId })),
              }
            : undefined,
          immunizations: payload.immunizationIds?.length
            ? {
                create: payload.immunizationIds.map((immunizationId) => ({
                  toddlerId,
                  immunizationId,
                  administeredAt: payload.examDate,
                })),
              }
            : undefined,
        },
        include: {
          interventions: {
            include: { interventionType: true },
          },
          immunizations: {
            include: { immunization: true },
          },
        },
      });

      await tx.growthStatusLog.create({
        data: createGrowthLog(evaluation, toddlerId, checkup.id, previousCheckup?.id),
      });

      return checkup;
    });

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE_CHECKUP',
      entityType: 'Checkup',
      entityId: created.id,
      description: `Input pemeriksaan untuk ${toddler.fullName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      data: {
        ...mapCheckup(created, toddler.gender),
        interventions: created.interventions,
        immunizations: created.immunizations,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCheckup = async (req, res, next) => {
  try {
    const id = req.validated.params.id;
    const payload = req.validated.body;
    const current = await prisma.checkup.findUnique({
      where: { id },
      include: { toddler: { include: { family: { select: { villageId: true } } } } },
    });
    if (!current) throw new ApiError(404, 'Pemeriksaan tidak ditemukan');
    ensureVillageAccess(req.user, current.toddler.family?.villageId, 'Anda hanya dapat mengubah pemeriksaan pada desa Anda');

    const previousCheckup = await prisma.checkup.findFirst({
      where: { toddlerId: current.toddlerId, examDate: { lt: payload.examDate || current.examDate }, id: { not: id } },
      orderBy: { examDate: 'desc' },
    });

    const merged = {
      examDate: payload.examDate || current.examDate,
      ageInMonths: payload.ageInMonths || current.ageInMonths,
      weight: payload.weight ?? Number(current.weight),
      height: payload.height ?? Number(current.height),
      headCircumference: payload.headCircumference ?? (current.headCircumference ? Number(current.headCircumference) : null),
      muac: payload.muac ?? (current.muac ? Number(current.muac) : null),
    };
    await ensurePosyanduVillageAccess(req.user, payload.posyanduId ?? current.posyanduId);

    const evaluation = evaluateGrowthStatus({
      toddler: current.toddler,
      currentCheckup: merged,
      previousCheckup,
    });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.checkupIntervention.deleteMany({ where: { checkupId: id } });
      await tx.toddlerImmunization.deleteMany({ where: { checkupId: id } });
      await tx.growthStatusLog.deleteMany({ where: { checkupId: id } });

      const checkup = await tx.checkup.update({
        where: { id },
        data: {
          examDate: merged.examDate,
          ageInMonths: evaluation.ageInMonths,
          weight: merged.weight,
          height: merged.height,
          headCircumference: merged.headCircumference,
          muac: merged.muac,
          immunizationNote: payload.immunizationNote ?? current.immunizationNote,
          vitaminPmtNote: payload.vitaminPmtNote ?? current.vitaminPmtNote,
          complaintNote: payload.complaintNote ?? current.complaintNote,
          officerName: payload.officerName ?? current.officerName,
          posyanduId: payload.posyanduId ?? current.posyanduId,
          growthTrend: evaluation.trend,
          riskLevel: evaluation.riskLevel,
          statusLabel: evaluation.statusLabel,
          growthSummary: evaluation.summary,
          interventions: payload.interventionTypeIds?.length
            ? { create: payload.interventionTypeIds.map((interventionTypeId) => ({ interventionTypeId })) }
            : undefined,
          immunizations: payload.immunizationIds?.length
            ? {
                create: payload.immunizationIds.map((immunizationId) => ({
                  toddlerId: current.toddlerId,
                  immunizationId,
                  administeredAt: merged.examDate,
                })),
              }
            : undefined,
        },
        include: {
          interventions: { include: { interventionType: true } },
          immunizations: { include: { immunization: true } },
        },
      });

      await tx.growthStatusLog.create({
        data: createGrowthLog(evaluation, current.toddlerId, checkup.id, previousCheckup?.id),
      });

      return checkup;
    });

    res.json({
      success: true,
      data: {
        ...mapCheckup(updated, current.toddler.gender),
        interventions: updated.interventions,
        immunizations: updated.immunizations,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCheckup = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const checkup = await prisma.checkup.findUnique({
      where: { id },
      include: { toddler: { include: { family: { select: { villageId: true } } } } },
    });
    if (!checkup) throw new ApiError(404, 'Pemeriksaan tidak ditemukan');
    ensureVillageAccess(req.user, checkup.toddler.family?.villageId, 'Anda hanya dapat menghapus pemeriksaan pada desa Anda');
    await prisma.checkup.delete({ where: { id } });
    res.json({ success: true, data: { message: 'Pemeriksaan dihapus' } });
  } catch (error) {
    next(error);
  }
};
