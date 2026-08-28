const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, executeSP, querySQL } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const register = async (req, res) => {
    try {
        const { userid, password } = req.body;

        if (!userid || !password) {
            return res.status(400).json({ error: 'User ID and Password are required' });
        }

        // Check if user exists using SP_PassMastGet
        const result = await executeSP('SP_PassMastGet', [
            { name: 'USERID', type: sql.VarChar, value: userid }
        ]);

        if (result.recordset && result.recordset.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert into PASSMAST using SP_PassMastSave
        await executeSP('SP_PassMastSave', [
            { name: 'USERID', type: sql.VarChar, value: userid },
            { name: 'PASSWORD', type: sql.VarChar, value: hashedPassword }
        ]);

        // Initialize default permissions in PERMAST
        const defaultForms = [
            { form: 'PARMAST_ENTRY', viw: 1, upd: 1, del: 0 },
            { form: 'TRNMAST_ENTRY', viw: 1, upd: 1, del: 0 },
            { form: 'LEDGER_VIEW', viw: 1, upd: 0, del: 0 },
            { form: 'PERMAST_ENTRY', viw: 0, upd: 0, del: 0 },
            { form: 'USER_UTILITY', viw: 0, upd: 0, del: 0 }
        ];

        for (const f of defaultForms) {
            try {
                await executeSP('SP_PermissionSave', [
                    { name: 'USERID', type: sql.VarChar, value: userid },
                    { name: 'FORM_NAME', type: sql.VarChar, value: f.form },
                    { name: 'VIW', type: sql.Bit, value: f.viw },
                    { name: 'UPD', type: sql.Bit, value: f.upd },
                    { name: 'DEL', type: sql.Bit, value: f.del }
                ]);
            } catch (permErr) {
                console.error(`Failed to init permission ${f.form} for ${userid}:`, permErr);
            }
        }

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { userid, password } = req.body;

        if (!userid || !password) {
            return res.status(400).json({ error: 'User ID and Password are required' });
        }

        // Get user from PASSMAST
        const result = await executeSP('SP_PassMastGet', [
            { name: 'USERID', type: sql.VarChar, value: userid }
        ]);
        
        const user = result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.PASSWORD);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ userid: user.USERID }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ message: 'Login successful', token, userid: user.USERID });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userid = req.user.userid;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Old and new passwords are required' });
        }

        // Get user from DB
        const result = await executeSP('SP_PassMastGet', [
            { name: 'USERID', type: sql.VarChar, value: userid }
        ]);
        
        const user = result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Validate old password
        const isMatch = await bcrypt.compare(oldPassword, user.PASSWORD);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect old password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update password using SP_PassMastSave (since it probably upserts)
        await executeSP('SP_PassMastSave', [
            { name: 'USERID', type: sql.VarChar, value: userid },
            { name: 'PASSWORD', type: sql.VarChar, value: hashedNewPassword }
        ]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getUsers = async (req, res) => {
    try {
        const result = await querySQL('SELECT USERID FROM PASSMAST ORDER BY USERID ASC');
        res.json(result.recordset || []);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { userid } = req.params;
        const currentUserId = req.user.userid;

        if (!userid) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (userid.toLowerCase() === currentUserId.toLowerCase()) {
            return res.status(400).json({ error: 'You cannot delete your own logged-in account.' });
        }

        await querySQL(`DELETE FROM PERMAST WHERE USERID = '${userid.replace(/'/g, "''")}'; DELETE FROM PASSMAST WHERE USERID = '${userid.replace(/'/g, "''")}';`);

        res.json({ message: `User "${userid}" deleted successfully` });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    register,
    login,
    changePassword,
    getUsers,
    deleteUser
};
