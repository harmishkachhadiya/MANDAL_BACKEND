const { sql, executeSP } = require('../config/db');

/**
 * Middleware factory to check specific permissions for a form.
 * @param {string} formName - The name of the form/screen (e.g., 'TRANSACTION_ENTRY')
 * @param {string} requiredAccess - The type of access required: 'VIW', 'UPD', or 'DEL'
 */
const checkPermission = (formName, requiredAccess) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.userid;

            // Query PERMAST using SP_GetPermission to check user access to this form
            const result = await executeSP('SP_GetPermission', [
                { name: 'USERID', type: sql.VarChar, value: userId }
            ]);

            // Filter the result for the specific formName
            const permission = (result.recordset || []).find(p => p.FORM_NAME === formName);

            if (!permission) {
                return res.status(403).json({ error: `Access Denied: No permissions defined for form ${formName}` });
            }

            // Check the specific flag based on requiredAccess parameter
            // Ensure we handle bit fields correctly (true/false)
            let hasAccess = false;
            if (requiredAccess === 'VIW') hasAccess = permission.VIW === true || permission.VIW === 1;
            if (requiredAccess === 'UPD') hasAccess = permission.UPD === true || permission.UPD === 1;
            if (requiredAccess === 'DEL') hasAccess = permission.DEL === true || permission.DEL === 1;

            if (!hasAccess) {
                return res.status(403).json({ error: `Access Denied: Missing ${requiredAccess} permission for ${formName}` });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ error: 'Internal server error during permission check' });
        }
    };
};

module.exports = { checkPermission };
