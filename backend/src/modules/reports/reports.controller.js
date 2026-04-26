import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify/sync';
import { prisma } from '../../config/prisma.js';
import { getActorVillageId } from '../../utils/village-scope.js';

const RISK_LABEL_MAP = {
  NORMAL: 'Normal',
  ATTENTION: 'Perlu perhatian',
  STUNTING_RISK: 'Risiko stunting',
  UNDERNUTRITION: 'Gizi kurang',
  OVERWEIGHT: 'Kelebihan berat badan',
};

const RISK_PRIORITY = {
  STUNTING_RISK: 5,
  UNDERNUTRITION: 4,
  OVERWEIGHT: 3,
  ATTENTION: 2,
  NORMAL: 1,
};

const sendCsv = (res, filename, rows) => {
  const csv = stringify(rows, { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(csv);
};

const sendXlsx = async (res, filename, rows) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');
  if (rows.length) {
    worksheet.columns = Object.keys(rows[0]).map((key) => ({
      header: key,
      key,
      width: 24,
    }));
    worksheet.addRows(rows);
  }
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

const sendPdf = (res, filename, title, rows) => {
  const doc = new PDFDocument({ margin: 36 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);
  doc.fontSize(18).text(title);
  doc.moveDown();
  rows.slice(0, 40).forEach((row, index) => {
    doc.fontSize(10).text(`${index + 1}. ${Object.values(row).join(' | ')}`);
  });
  doc.end();
};

const respondByFormat = async (res, format, filename, title, rows) => {
  if (format === 'csv') return sendCsv(res, filename, rows);
  if (format === 'xlsx') return sendXlsx(res, filename, rows);
  if (format === 'pdf') return sendPdf(res, filename, title, rows);
  return res.json({ success: true, data: rows });
};

const toMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const toMonthLabel = (date) =>
  new Intl.DateTimeFormat('id-ID', {
    month: 'short',
    year: '2-digit',
  }).format(date);

const percent = (value, total) => {
  if (!total) return 0;
  return Number(((value / total) * 100).toFixed(1));
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const toYmdLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultRange = () => {
  const endDate = endOfDay(new Date());
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 11);
  startDate.setDate(1);
  return {
    startDate: startOfDay(startDate),
    endDate,
  };
};

const resolveDateRange = (query) => {
  const defaults = getDefaultRange();
  const start = toDateOrNull(query.startDate);
  const end = toDateOrNull(query.endDate);

  let startDate = start ? startOfDay(start) : defaults.startDate;
  let endDate = end ? endOfDay(end) : defaults.endDate;

  if (startDate > endDate) {
    const temp = startDate;
    startDate = startOfDay(endDate);
    endDate = endOfDay(temp);
  }

  return {
    startDate,
    endDate,
    startDateIso: toYmdLocal(startDate),
    endDateIso: toYmdLocal(endDate),
  };
};

const buildMonthlyBucketsInRange = (startDate, endDate) => {
  const months = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const maxMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cursor <= maxMonth) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
};

export const getToddlerReport = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const { startDate, endDate, startDateIso, endDateIso } = resolveDateRange(req.query);
    const toddlers = await prisma.toddler.findMany({
      where: actorVillageId === null ? undefined : { family: { is: { villageId: actorVillageId } } },
      include: {
        hamlet: true,
        posyandu: true,
        checkups: {
          where: {
            examDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { examDate: 'desc' },
          take: 1,
        },
      },
    });

    const rows = toddlers.map((item) => ({
      kode_balita: item.code,
      nama_lengkap: item.fullName,
      jenis_kelamin: item.gender,
      dusun: item.hamlet.name,
      posyandu: item.posyandu.name,
      status: item.status,
      tanggal_pemeriksaan_terakhir: item.checkups[0]?.examDate.toISOString().slice(0, 10) || '-',
      risiko_terakhir: item.checkups[0]?.riskLevel || '-',
      status_pertumbuhan: item.checkups[0]?.statusLabel || '-',
    }));

    if (!req.query.format) {
      return res.json({
        success: true,
        data: rows,
        period: { startDate: startDateIso, endDate: endDateIso },
      });
    }

    await respondByFormat(res, req.query.format, 'laporan-balita', 'Laporan Balita', rows);
  } catch (error) {
    next(error);
  }
};

export const getCheckupReport = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const { startDate, endDate, startDateIso, endDateIso } = resolveDateRange(req.query);
    const where = {
      examDate: {
        gte: startDate,
        lte: endDate,
      },
      ...(actorVillageId === null ? {} : { toddler: { family: { is: { villageId: actorVillageId } } } }),
    };
    const checkups = await prisma.checkup.findMany({
      where,
      include: {
        toddler: true,
        posyandu: true,
      },
      orderBy: { examDate: 'desc' },
    });

    const rows = checkups.map((item) => ({
      tanggal: item.examDate.toISOString().slice(0, 10),
      kode_balita: item.toddler.code,
      nama_balita: item.toddler.fullName,
      posyandu: item.posyandu.name,
      bb: Number(item.weight),
      tb: Number(item.height),
      status: item.statusLabel,
      risiko: item.riskLevel,
      petugas: item.officerName,
    }));

    if (!req.query.format) {
      return res.json({
        success: true,
        data: rows,
        period: { startDate: startDateIso, endDate: endDateIso },
      });
    }

    await respondByFormat(res, req.query.format, 'laporan-pemeriksaan', 'Laporan Pemeriksaan', rows);
  } catch (error) {
    next(error);
  }
};

export const getRiskReport = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const { startDate, endDate, startDateIso, endDateIso } = resolveDateRange(req.query);
    const toddlers = await prisma.toddler.findMany({
      where: actorVillageId === null ? undefined : { family: { is: { villageId: actorVillageId } } },
      include: {
        hamlet: true,
        posyandu: true,
        checkups: {
          where: {
            examDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: { examDate: 'desc' },
          take: 1,
        },
      },
    });

    const rows = toddlers
      .filter((item) => item.checkups[0]?.riskLevel && item.checkups[0]?.riskLevel !== 'NORMAL')
      .map((item) => ({
        kode_balita: item.code,
        nama_balita: item.fullName,
        dusun: item.hamlet.name,
        posyandu: item.posyandu.name,
        risiko: item.checkups[0]?.riskLevel,
        status: item.checkups[0]?.statusLabel,
        tanggal_terakhir: item.checkups[0]?.examDate.toISOString().slice(0, 10),
      }));

    if (!req.query.format) {
      return res.json({
        success: true,
        data: rows,
        period: { startDate: startDateIso, endDate: endDateIso },
      });
    }

    await respondByFormat(res, req.query.format, 'laporan-risiko-balita', 'Laporan Balita Risiko', rows);
  } catch (error) {
    next(error);
  }
};

export const getReportInsights = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const { startDate, endDate, startDateIso, endDateIso } = resolveDateRange(req.query);
    const monthlyBuckets = buildMonthlyBucketsInRange(startDate, endDate);
    const monthMap = new Map(
      monthlyBuckets.map((monthDate) => [
        toMonthKey(monthDate),
        {
          key: toMonthKey(monthDate),
          label: toMonthLabel(monthDate),
          totalCheckups: 0,
          totalRisk: 0,
          normal: 0,
          attention: 0,
          stuntingRisk: 0,
          undernutrition: 0,
          overweight: 0,
        },
      ]),
    );

    const [toddlers, recentCheckups] = await Promise.all([
      prisma.toddler.findMany({
        where: actorVillageId === null ? undefined : { family: { is: { villageId: actorVillageId } } },
        include: {
          hamlet: true,
          posyandu: true,
          checkups: {
            where: {
              examDate: {
                gte: startDate,
                lte: endDate,
              },
            },
            orderBy: { examDate: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.checkup.findMany({
        where: {
          examDate: {
            gte: startDate,
            lte: endDate,
          },
          ...(actorVillageId === null ? {} : { toddler: { family: { is: { villageId: actorVillageId } } } }),
        },
        select: {
          examDate: true,
          riskLevel: true,
        },
      }),
    ]);

    for (const checkup of recentCheckups) {
      const key = toMonthKey(checkup.examDate);
      const bucket = monthMap.get(key);
      if (!bucket) continue;
      bucket.totalCheckups += 1;
      if (checkup.riskLevel !== 'NORMAL') bucket.totalRisk += 1;
      if (checkup.riskLevel === 'NORMAL') bucket.normal += 1;
      if (checkup.riskLevel === 'ATTENTION') bucket.attention += 1;
      if (checkup.riskLevel === 'STUNTING_RISK') bucket.stuntingRisk += 1;
      if (checkup.riskLevel === 'UNDERNUTRITION') bucket.undernutrition += 1;
      if (checkup.riskLevel === 'OVERWEIGHT') bucket.overweight += 1;
    }

    const latestEvaluations = toddlers
      .map((item) => ({
        toddler: item,
        latest: item.checkups[0] || null,
      }))
      .filter((item) => item.latest);

    const totalBalita = toddlers.length;
    const balitaAktif = toddlers.filter((item) => item.status === 'ACTIVE').length;
    const totalDinilai = latestEvaluations.length;

    const riskCount = {
      NORMAL: 0,
      ATTENTION: 0,
      STUNTING_RISK: 0,
      UNDERNUTRITION: 0,
      OVERWEIGHT: 0,
    };

    const hamletStatsMap = new Map();

    for (const item of toddlers) {
      const key = item.hamlet?.name || '-';
      if (!hamletStatsMap.has(key)) {
        hamletStatsMap.set(key, {
          hamlet: key,
          totalBalita: 0,
          totalDipantau: 0,
          totalStunting: 0,
        });
      }
      const current = hamletStatsMap.get(key);
      current.totalBalita += 1;
    }

    for (const item of latestEvaluations) {
      const risk = item.latest.riskLevel;
      riskCount[risk] += 1;
      const hamletKey = item.toddler.hamlet?.name || '-';
      const hamlet = hamletStatsMap.get(hamletKey);
      if (hamlet && risk !== 'NORMAL') hamlet.totalDipantau += 1;
      if (hamlet && risk === 'STUNTING_RISK') hamlet.totalStunting += 1;
    }

    const balitaDipantau = totalDinilai - riskCount.NORMAL;
    const riskDistribution = Object.entries(riskCount).map(([riskLevel, total]) => ({
      riskLevel,
      label: RISK_LABEL_MAP[riskLevel],
      total,
      percent: percent(total, totalDinilai),
    }));

    const hamletDistribution = [...hamletStatsMap.values()]
      .map((item) => ({
        ...item,
        percentDipantau: percent(item.totalDipantau, item.totalBalita),
      }))
      .sort((a, b) => b.totalDipantau - a.totalDipantau);

    const priorityToddlers = latestEvaluations
      .filter((item) => item.latest.riskLevel !== 'NORMAL')
      .sort((a, b) => {
        const riskDiff = RISK_PRIORITY[b.latest.riskLevel] - RISK_PRIORITY[a.latest.riskLevel];
        if (riskDiff !== 0) return riskDiff;
        return new Date(a.latest.examDate).getTime() - new Date(b.latest.examDate).getTime();
      })
      .slice(0, 30)
      .map((item) => ({
        id: item.toddler.id,
        kodeBalita: item.toddler.code,
        namaBalita: item.toddler.fullName,
        dusun: item.toddler.hamlet?.name || '-',
        posyandu: item.toddler.posyandu?.name || '-',
        riskLevel: item.latest.riskLevel,
        statusLabel: item.latest.statusLabel,
        tanggalTerakhir: item.latest.examDate.toISOString().slice(0, 10),
      }));

    res.json({
      success: true,
      data: {
        summary: {
          totalBalita,
          balitaAktif,
          totalDinilai,
          balitaDipantau,
          persentaseDipantau: percent(balitaDipantau, totalDinilai),
          stuntingCount: riskCount.STUNTING_RISK,
          stuntingPercent: percent(riskCount.STUNTING_RISK, totalDinilai),
          normalCount: riskCount.NORMAL,
          normalPercent: percent(riskCount.NORMAL, totalDinilai),
        },
        riskDistribution,
        monthlyTrend: [...monthMap.values()],
        hamletDistribution,
        priorityToddlers,
        period: {
          startDate: startDateIso,
          endDate: endDateIso,
          totalMonths: monthlyBuckets.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
