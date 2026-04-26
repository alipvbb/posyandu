import dayjs from 'dayjs';
import { prisma } from '../../config/prisma.js';
import { mapCheckup, mapToddler } from '../balita/balita.shared.js';
import { buildPublicCardUrl } from '../../utils/request-url.js';
import { ensureVillageAccess, getActorVillageId } from '../../utils/village-scope.js';

const buildCardPayload = (card, req) => ({
  toddlerId: card.toddlerId,
  cardNumber: card.cardNumber,
  publicToken: card.publicToken,
  publicUrl: buildPublicCardUrl(req, card.publicToken),
  toddler: mapToddler(card.toddler),
});

export const getCardByToddlerId = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const card = await prisma.toddlerCard.findFirst({
      where: { toddlerId: Number(req.params.id) },
      include: {
        toddler: {
          include: {
            hamlet: true,
            rw: true,
            rt: true,
            posyandu: true,
            family: true,
            cards: true,
            checkups: {
              orderBy: { examDate: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!card) {
      return res.status(404).json({ success: false, message: 'Kartu tidak ditemukan' });
    }
    if (actorVillageId !== null) {
      ensureVillageAccess(req.user, card.toddler.family?.villageId, 'Anda hanya dapat melihat kartu pada desa Anda');
    }

    res.json({ success: true, data: buildCardPayload(card, req) });
  } catch (error) {
    next(error);
  }
};

export const getPublicCard = async (req, res, next) => {
  try {
    const years = req.query.years === 'all' ? 'all' : Number(req.query.years || 2);
    const card = await prisma.toddlerCard.findUnique({
      where: { publicToken: req.params.token },
      include: {
        toddler: {
          include: {
            hamlet: true,
            posyandu: true,
            cards: true,
            checkups: {
              orderBy: { examDate: 'desc' },
            },
          },
        },
      },
    });

    if (!card) {
      return res.status(404).json({ success: false, message: 'Kartu tidak ditemukan' });
    }

    const filteredCheckups =
      years === 'all'
        ? card.toddler.checkups
        : card.toddler.checkups.filter((item) => dayjs(item.examDate).isAfter(dayjs().subtract(years, 'year')));

    res.json({
      success: true,
      data: {
        toddler: {
          id: card.toddler.id,
          code: card.toddler.code,
          fullName: card.toddler.fullName,
          birthDate: card.toddler.birthDate,
          gender: card.toddler.gender,
          motherName: card.toddler.motherName,
          fatherName: card.toddler.fatherName,
          hamlet: card.toddler.hamlet.name,
          posyandu: card.toddler.posyandu.name,
          qrCodeValue: card.toddler.qrCodeValue,
        },
        card: {
          cardNumber: card.cardNumber,
          publicToken: card.publicToken,
          publicUrl: buildPublicCardUrl(req, card.publicToken),
        },
        latestCheckup: filteredCheckups[0] ? mapCheckup(filteredCheckups[0], card.toddler.gender) : null,
        history: filteredCheckups.map((item) => mapCheckup(item, card.toddler.gender)),
        filter: {
          years,
          options: [1, 2, 3, 5, 'all'],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
