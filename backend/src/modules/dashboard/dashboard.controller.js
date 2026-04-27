import dayjs from 'dayjs';
import { prisma } from '../../config/prisma.js';
import { getActorVillageId } from '../../utils/village-scope.js';

const normalizeRiskLevel = (riskLevel) => (riskLevel === 'ATTENTION' ? 'NORMAL' : riskLevel || 'NORMAL');

const lastMonths = (count) =>
  Array.from({ length: count }).map((_, index) => dayjs().subtract(count - index - 1, 'month'));

export const getDashboardSummary = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const now = dayjs();
    const monthStart = now.startOf('month').toDate();
    const monthEnd = now.endOf('month').toDate();
    const [toddlers, monthlyCheckups, hamlets, users, roles] = await Promise.all([
      prisma.toddler.findMany({
        where: actorVillageId === null ? undefined : { family: { is: { villageId: actorVillageId } } },
        include: {
          hamlet: true,
          posyandu: true,
          checkups: {
            orderBy: { examDate: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.checkup.findMany({
        where: {
          examDate: {
            gte: dayjs().subtract(5, 'month').startOf('month').toDate(),
          },
          ...(actorVillageId === null ? {} : { toddler: { family: { is: { villageId: actorVillageId } } } }),
        },
        select: {
          id: true,
          examDate: true,
          riskLevel: true,
          toddlerId: true,
        },
      }),
      prisma.hamlet.findMany({
        where: actorVillageId === null ? undefined : { villageId: actorVillageId },
      }),
      prisma.user.count({
        where: actorVillageId === null ? undefined : { villageId: actorVillageId },
      }),
      prisma.role.count(),
    ]);

    const activeToddlers = toddlers.filter((item) => item.status === 'ACTIVE');
    const latestRisk = toddlers.filter((item) => normalizeRiskLevel(item.checkups[0]?.riskLevel) !== 'NORMAL');
    const healthyGrowth = toddlers.filter((item) => normalizeRiskLevel(item.checkups[0]?.riskLevel) === 'NORMAL');
    const dueThisMonth = activeToddlers.filter(
      (item) => !item.checkups[0] || !dayjs(item.checkups[0].examDate).isSame(now, 'month'),
    );
    const checkedThisMonth = new Set(
      monthlyCheckups.filter((checkup) => dayjs(checkup.examDate).isSame(now, 'month')).map((checkup) => checkup.toddlerId),
    );
    const attendedThisMonth = activeToddlers.filter((item) => item.checkups[0] && dayjs(item.checkups[0].examDate).isSame(now, 'month'));
    const riskPriority = {
      STUNTING_RISK: 1,
      UNDERNUTRITION: 2,
      OVERWEIGHT: 3,
      NORMAL: 4,
      UNKNOWN: 6,
    };
    const absenceFollowUpList = [...dueThisMonth]
      .sort((a, b) => {
        const riskA = riskPriority[normalizeRiskLevel(a.checkups[0]?.riskLevel) || 'UNKNOWN'] || riskPriority.UNKNOWN;
        const riskB = riskPriority[normalizeRiskLevel(b.checkups[0]?.riskLevel) || 'UNKNOWN'] || riskPriority.UNKNOWN;
        if (riskA !== riskB) return riskA - riskB;
        const lastExamA = a.checkups[0]?.examDate ? dayjs(a.checkups[0].examDate).valueOf() : 0;
        const lastExamB = b.checkups[0]?.examDate ? dayjs(b.checkups[0].examDate).valueOf() : 0;
        return lastExamA - lastExamB;
      })
      .map((item) => ({
        id: item.id,
        fullName: item.fullName,
        code: item.code,
        hamlet: item.hamlet?.name,
        posyandu: item.posyandu?.name,
        parentPhone: item.parentPhone,
        motherName: item.motherName,
        fatherName: item.fatherName,
        latestRisk: normalizeRiskLevel(item.checkups[0]?.riskLevel) || null,
        latestStatus: item.checkups[0]?.statusLabel || null,
        lastExamDate: item.checkups[0]?.examDate || null,
      }));
    const attendedList = [...attendedThisMonth]
      .sort((a, b) => dayjs(b.checkups[0]?.examDate).valueOf() - dayjs(a.checkups[0]?.examDate).valueOf())
      .map((item) => ({
        id: item.id,
        fullName: item.fullName,
        code: item.code,
        hamlet: item.hamlet?.name,
        posyandu: item.posyandu?.name,
        parentPhone: item.parentPhone,
        motherName: item.motherName,
        attendanceDate: item.checkups[0]?.examDate || null,
        officerName: item.checkups[0]?.officerName || null,
        latestRisk: normalizeRiskLevel(item.checkups[0]?.riskLevel) || null,
      }));
    const monthlyChart = lastMonths(6).map((month) => ({
      label: month.format('MMM YYYY'),
      total: monthlyCheckups.filter((checkup) => dayjs(checkup.examDate).isSame(month, 'month')).length,
    }));
    const hamletDistribution = hamlets.map((hamlet) => ({
      id: hamlet.id,
      name: hamlet.name,
      totalToddlers: toddlers.filter((item) => item.hamletId === hamlet.id).length,
      riskToddlers: toddlers.filter(
        (item) => item.hamletId === hamlet.id && normalizeRiskLevel(item.checkups[0]?.riskLevel) !== 'NORMAL',
      ).length,
    }));

    res.json({
      success: true,
      data: {
        kepalaDesa: {
          totalBalita: toddlers.length,
          totalBalitaAktif: activeToddlers.length,
          jumlahBalitaRisiko: latestRisk.length,
          jumlahBalitaPertumbuhanBaik: healthyGrowth.length,
          sebaranPerDusun: hamletDistribution,
          grafikPemeriksaanBulanan: monthlyChart,
          daftarButuhPerhatian: toddlers
            .filter((item) => normalizeRiskLevel(item.checkups[0]?.riskLevel) !== 'NORMAL')
            .slice(0, 10)
            .map((item) => ({
              id: item.id,
              fullName: item.fullName,
              code: item.code,
              hamlet: item.hamlet.name,
              latestRisk: normalizeRiskLevel(item.checkups[0]?.riskLevel),
              latestStatus: item.checkups[0]?.statusLabel,
            })),
          ringkasanKehadiranPosyandu: {
            hadirBulanIni: checkedThisMonth.size,
            belumDiperiksaBulanIni: dueThisMonth.length,
            daftarHadirBulanIni: attendedList.slice(0, 30),
            daftarTidakHadirBulanIni: absenceFollowUpList.slice(0, 30),
          },
        },
        petugas: {
          shortcutScanQr: true,
          balitaBulanIni: checkedThisMonth.size,
          balitaBelumDiperiksaBulanIni: dueThisMonth.length,
          balitaRisikoTinggi: toddlers.filter((item) => normalizeRiskLevel(item.checkups[0]?.riskLevel) === 'STUNTING_RISK').length,
          statistikPemeriksaanSingkat: {
            totalPemeriksaanBulanIni: monthlyCheckups.filter((item) => dayjs(item.examDate).isSame(now, 'month')).length,
            totalBalitaAktif: activeToddlers.length,
          },
        },
        admin: {
          jumlahUser: users,
          userAktif: await prisma.user.count({
            where: {
              status: 'ACTIVE',
              ...(actorVillageId === null ? {} : { villageId: actorVillageId }),
            },
          }),
          roleList: roles,
          statistikDataMaster: {
            dusun: hamlets.length,
            balita: toddlers.length,
            pemeriksaanBulanIni: monthlyCheckups.filter((item) => dayjs(item.examDate).isSame(now, 'month')).length,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardRisk = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const toddlers = await prisma.toddler.findMany({
      where: actorVillageId === null ? undefined : { family: { is: { villageId: actorVillageId } } },
      include: {
        hamlet: true,
        posyandu: true,
        checkups: {
          orderBy: { examDate: 'desc' },
          take: 1,
        },
      },
    });

    const items = toddlers
      .filter((item) => normalizeRiskLevel(item.checkups[0]?.riskLevel) !== 'NORMAL')
      .map((item) => ({
        id: item.id,
        code: item.code,
        fullName: item.fullName,
        hamlet: item.hamlet.name,
        posyandu: item.posyandu.name,
        riskLevel: normalizeRiskLevel(item.checkups[0].riskLevel),
        statusLabel: item.checkups[0].statusLabel,
        examDate: item.checkups[0].examDate,
      }));

    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};
