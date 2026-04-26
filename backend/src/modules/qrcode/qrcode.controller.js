import QRCode from 'qrcode';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { buildPublicCardUrl } from '../../utils/request-url.js';
import { ensureVillageAccess, getActorVillageId } from '../../utils/village-scope.js';

export const getQrCode = async (req, res, next) => {
  try {
    const actorVillageId = getActorVillageId(req.user);
    const toddlerId = Number(req.params.id);
    const card = await prisma.toddlerCard.findFirst({
      where: { toddlerId },
      include: { toddler: { include: { family: { select: { villageId: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!card) throw new ApiError(404, 'Kartu balita tidak ditemukan');
    if (actorVillageId !== null) {
      ensureVillageAccess(req.user, card.toddler.family?.villageId, 'Anda hanya dapat melihat QR desa Anda');
    }
    const publicUrl = buildPublicCardUrl(req, card.publicToken);

    const dataUrl = await QRCode.toDataURL(publicUrl, {
      width: 320,
      margin: 1,
    });

    res.json({
      success: true,
      data: {
        toddlerId,
        toddlerName: card.toddler.fullName,
        value: publicUrl,
        publicUrl,
        dataUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
