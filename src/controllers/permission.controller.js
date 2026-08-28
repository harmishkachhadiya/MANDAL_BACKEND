const { sql, executeSP } = require('../config/db');

const getUserPermissions = async (req, res) => {
    try {
        const { userid } = req.params;

        const result = await executeSP('SP_GetPermission', [
            { name: 'USERID', type: sql.VarChar, value: userid }
        ]);
        
        res.json(result.recordset || []);
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const setPermission = async (req, res) => {
    try {
        const { userid, formName, viw, upd, del } = req.body;

        if (!userid || !formName) {
            return res.status(400).json({ error: 'USERID and FORM_NAME are required' });
        }

        const result = await executeSP('SP_PermissionSave', [
            { name: 'USERID', type: sql.VarChar, value: userid },
            { name: 'FORM_NAME', type: sql.VarChar, value: formName },
            { name: 'VIW', type: sql.Bit, value: viw ? 1 : 0 },
            { name: 'UPD', type: sql.Bit, value: upd ? 1 : 0 },
            { name: 'DEL', type: sql.Bit, value: del ? 1 : 0 }
        ]);

        res.json({ message: 'Permission saved successfully' });
    } catch (error) {
        console.error('Error setting permission:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deletePermission = async (req, res) => {
    try {
        const { userid, formName } = req.params;

        await executeSP('SP_PermissionDelete', [
            { name: 'USERID', type: sql.VarChar, value: userid },
            { name: 'FORM_NAME', type: sql.VarChar, value: formName }
        ]);

        res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
        console.error('Error deleting permission:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getUserPermissions,
    setPermission,
    deletePermission
};
