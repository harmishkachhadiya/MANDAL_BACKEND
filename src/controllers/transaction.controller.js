const { sql, executeSP, querySQL } = require('../config/db');

// Fetch transactions for a given date
const getTransactionsByDate = async (req, res) => {
    try {
        const trnDate = req.query.date || new Date().toISOString().split('T')[0];

        const result = await executeSP('SP_TransactionGet', [
            { name: 'TRNDATE', type: sql.Date, value: trnDate }
        ]);

        res.json(result.recordset || []);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create or update transaction
const createTransaction = async (req, res) => {
    try {
        const { TRNNO, TRNDATE, P_CODE, INSTALLMENT, UPAD, JAMA, INTREST, FINE, EXPENSE, REMARK } = req.body;

        if (!P_CODE) {
            return res.status(400).json({ error: 'Party Code is required' });
        }

        const calcTotal = Number(JAMA || 0) + Number(INSTALLMENT || 0) + Number(INTREST || 0) + Number(FINE || 0);

        // If TRNNO is provided, update existing record
        if (TRNNO) {
            await querySQL(`
                UPDATE [dbo].[TRNMAST]
                SET 
                    [TRNDATE] = @TRNDATE,
                    [P_CODE] = @P_CODE,
                    [INSTALLMENT] = @INSTALLMENT,
                    [UPAD] = @UPAD,
                    [JAMA] = @JAMA,
                    [INTREST] = @INTREST,
                    [FINE] = @FINE,
                    [EXPENSE] = @EXPENSE,
                    [TOTAL] = @TOTAL,
                    [REMARK] = @REMARK
                WHERE [TRNNO] = @TRNNO
            `, [
                { name: 'TRNNO', type: sql.Int, value: Number(TRNNO) },
                { name: 'TRNDATE', type: sql.Date, value: TRNDATE || new Date().toISOString().split('T')[0] },
                { name: 'P_CODE', type: sql.VarChar, value: P_CODE },
                { name: 'INSTALLMENT', type: sql.Money, value: INSTALLMENT || 0 },
                { name: 'UPAD', type: sql.Money, value: UPAD || 0 },
                { name: 'JAMA', type: sql.Money, value: JAMA || 0 },
                { name: 'INTREST', type: sql.Money, value: INTREST || 0 },
                { name: 'FINE', type: sql.Money, value: FINE || 0 },
                { name: 'EXPENSE', type: sql.Money, value: EXPENSE || 0 },
                { name: 'TOTAL', type: sql.Money, value: calcTotal },
                { name: 'REMARK', type: sql.VarChar, value: REMARK || '' }
            ]);

            return res.json({
                message: `Transaction #${TRNNO} updated successfully`,
                TRNNO: Number(TRNNO)
            });
        }

        // Otherwise insert new transaction via SP_TransactionSave
        const result = await executeSP('SP_TransactionSave', [
            { name: 'TRNDATE', type: sql.Date, value: TRNDATE },
            { name: 'P_CODE', type: sql.VarChar, value: P_CODE },
            { name: 'INSTALLMENT', type: sql.Money, value: INSTALLMENT || 0 },
            { name: 'UPAD', type: sql.Money, value: UPAD || 0 },
            { name: 'JAMA', type: sql.Money, value: JAMA || 0 },
            { name: 'INTREST', type: sql.Money, value: INTREST || 0 },
            { name: 'FINE', type: sql.Money, value: FINE || 0 },
            { name: 'EXPENSE', type: sql.Money, value: EXPENSE || 0 },
            { name: 'REMARK', type: sql.VarChar, value: REMARK || '' },
            { name: 'NEW_TRNNO', type: sql.Int, isOutput: true }
        ]);

        const newTrnNo = result.output.NEW_TRNNO;

        res.status(201).json({
            message: 'Transaction saved successfully',
            TRNNO: newTrnNo
        });
    } catch (error) {
        console.error('Error saving transaction:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

const updateTransaction = async (req, res) => {
    req.body.TRNNO = req.params.id;
    return createTransaction(req, res);
};

const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        await executeSP('SP_TransactionDelete', [
            { name: 'TRNNO', type: sql.Int, value: id }
        ]);

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getTransactionsByDate,
    createTransaction,
    updateTransaction,
    deleteTransaction
};
