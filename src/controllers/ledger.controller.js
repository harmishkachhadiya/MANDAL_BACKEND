const { sql, executeSP } = require('../config/db');

const getLedgerStatement = async (req, res) => {
    try {
        const { pcode, from, to } = req.query;

        if (!pcode || !from || !to) {
            return res.status(400).json({ error: 'pcode, from, and to dates are required' });
        }

        const result = await executeSP('SP_GetLedgerStatement', [
            { name: 'P_CODE', type: sql.VarChar, value: pcode },
            { name: 'FROM_DATE', type: sql.Date, value: from },
            { name: 'TO_DATE', type: sql.Date, value: to }
        ]);

        res.json(result.recordset || []);
    } catch (error) {
        console.error('Error fetching ledger statement:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getLedgerStatement
};
