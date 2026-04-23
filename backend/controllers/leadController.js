const Lead = require('../models/Lead');
const { parseCsv } = require('../services/csvService');

const getLeads = async (req, res) => {
  try {
    const { status, search, sort = '-createdAt' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { brandName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
      ];
    }
    const leads = await Lead.find(filter).sort(sort);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createLead = async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json(lead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadCsv = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });
    const rows = await parseCsv(req.file.buffer);

    const results = { imported: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      const email = (row['Email'] || row['email'] || '').trim().toLowerCase();
      const brandName = (row['Brand Name'] || row['brandName'] || row['brand_name'] || '').trim();

      if (!email || !brandName) {
        results.skipped++;
        continue;
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.errors.push(`Invalid email: ${email}`);
        results.skipped++;
        continue;
      }

      try {
        await Lead.findOneAndUpdate(
          { email },
          {
            brandName,
            contactName: (row['Contact Name'] || row['contactName'] || '').trim(),
            email,
            website: (row['Website'] || row['website'] || '').trim(),
            productType: (row['Product Type'] || row['productType'] || '').trim(),
            status: 'Ready',
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        results.imported++;
      } catch {
        results.skipped++;
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [total, emailSent, replied, interested, clients] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'Email Sent' }),
      Lead.countDocuments({ status: 'Replied' }),
      Lead.countDocuments({ status: 'Interested' }),
      Lead.countDocuments({ status: 'Client' }),
    ]);
    res.json({ total, emailSent, replied, interested, clients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getLeads, getLead, createLead, updateLead, deleteLead, uploadCsv, getStats };
