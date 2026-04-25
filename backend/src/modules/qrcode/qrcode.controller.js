import QRCode from 'qrcode';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { buildPublicCardUrl } from '../../utils/request-url.js';

export const getQrCode = async (req, res, next) => {
  try {
    const toddlerId = Number(req.params.id);
    const card = await prisma.toddlerCard.findFirst({
      where: { toddlerId },
      include: { toddler: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!card) throw new ApiError(404, 'Kartu balita tidak ditemukan');
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
