const EmailLog = require('../models/EmailLog');

const getLogs = async (req, res) => {
  try {
    const { leadId, dateFrom, dateTo, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (leadId) filter.leadId = leadId;
    if (dateFrom || dateTo) {
      filter.sentAt = {};
      if (dateFrom) filter.sentAt.$gte = new Date(dateFrom);
      if (dateTo) filter.sentAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { recipientEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      EmailLog.find(filter).populate('leadId', 'brandName email').sort('-sentAt').skip(skip).limit(Number(limit)),
      EmailLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEmailsPerDay = async (req, res) => {
  try {
    const days = Number(req.query.days) || 14;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const data = await EmailLog.aggregate([
      { $match: { sentAt: { $gte: since }, status: 'sent' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } },
          count: { $sum: 1 },
          opened: { $sum: { $cond: ['$opened', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEmailStats = async (req, res) => {
  try {
    const [totalSent, totalOpened] = await Promise.all([
      EmailLog.countDocuments({ status: 'sent' }),
      EmailLog.countDocuments({ status: 'sent', opened: true }),
    ]);

    const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

    res.json({ totalSent, totalOpened, openRate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getLogs, getEmailsPerDay, getEmailStats };
