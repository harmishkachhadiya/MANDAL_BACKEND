const { sql, executeSP } = require('../config/db');

const getParties = async (req, res) => {
    try {
        const searchTerm = req.query.search || '';

        const result = await executeSP('SP_GetParty', [
            { name: 'SEARCH_TERM', type: sql.VarChar, value: searchTerm }
        ]);

        res.json(result.recordset || []);
    } catch (error) {
        console.error('Error fetching parties:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const saveParty = async (req, res) => {
    try {
        const { 
            P_CODE, 
            P_NAME, 
            ADD1 = '', 
            MBILE = '', 
            INSTALLMENT = 0 
        } = req.body;

        if (!P_CODE || !P_NAME) {
            return res.status(400).json({ error: 'P_CODE and P_NAME are required' });
        }

        await executeSP('SP_InsertPartySave', [
            { name: 'P_CODE', type: sql.VarChar, value: P_CODE },
            { name: 'P_NAME', type: sql.VarChar, value: P_NAME },
            { name: 'ADD1', type: sql.VarChar, value: ADD1 },
            { name: 'MBILE', type: sql.VarChar, value: MBILE },
            { name: 'INSTALLMENT', type: sql.Money, value: INSTALLMENT }
        ]);

        res.status(201).json({ message: 'Party saved successfully' });
    } catch (error) {
        console.error('Error saving party:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteParty = async (req, res) => {
    try {
        const { id } = req.params; // Using id in the route for P_CODE
        
        await executeSP('SP_DeleteParty', [
            { name: 'P_CODE', type: sql.VarChar, value: id }
        ]);
        
        res.json({ message: 'Party deleted successfully' });
    } catch (error) {
        console.error('Error deleting party:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getParties,
    saveParty,
    deleteParty
};
