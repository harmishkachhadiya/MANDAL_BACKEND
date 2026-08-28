const fs = require('fs');
const path = require('path');
const { querySQL } = require('../config/db');

const BACKUP_DIR = path.join(__dirname, '../../backups');
const BACKUP_PREFIX = 'MandalBackup';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate complete database dump in SQL format
const generateDatabaseDump = async () => {
    const tableRes = await querySQL(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE' 
          AND TABLE_NAME NOT LIKE 'sys%'
          AND TABLE_NAME != 'dtproperties'
        ORDER BY TABLE_NAME ASC
    `);

    const tables = (tableRes.recordset || []).map(r => r.TABLE_NAME);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    let sqlDump = `-- ========================================================\n`;
    sqlDump += `-- Mandal Financial Database Backup\n`;
    sqlDump += `-- Database: ${process.env.SQL_DATABASE || 'Mandal'}\n`;
    sqlDump += `-- Generated On: ${timestampStr}\n`;
    sqlDump += `-- ========================================================\n\n`;

    for (const table of tables) {
        sqlDump += `-- --------------------------------------------------------\n`;
        sqlDump += `-- Table: [${table}]\n`;
        sqlDump += `-- --------------------------------------------------------\n`;

        // Fetch columns
        const colRes = await querySQL(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '${table}'
            ORDER BY ORDINAL_POSITION ASC
        `);
        const cols = colRes.recordset || [];
        const colNames = cols.map(c => `[${c.COLUMN_NAME}]`).join(', ');

        // Fetch table data
        const dataRes = await querySQL(`SELECT * FROM [dbo].[${table}]`);
        const rows = dataRes.recordset || [];

        if (rows.length > 0) {
            for (const row of rows) {
                const values = cols.map(c => {
                    const val = row[c.COLUMN_NAME];
                    if (val === null || val === undefined) return 'NULL';
                    if (typeof val === 'boolean' || c.DATA_TYPE === 'bit') return val ? 1 : 0;
                    if (typeof val === 'number' || c.DATA_TYPE === 'int' || c.DATA_TYPE === 'money' || c.DATA_TYPE === 'decimal' || c.DATA_TYPE === 'numeric') {
                        return isNaN(val) ? 'NULL' : val;
                    }
                    if (val instanceof Date) {
                        const dStr = `${val.getFullYear()}-${pad(val.getMonth()+1)}-${pad(val.getDate())}`;
                        return `'${dStr}'`;
                    }
                    return `'${String(val).replace(/'/g, "''")}'`;
                });

                sqlDump += `INSERT INTO [dbo].[${table}] (${colNames}) VALUES (${values.join(', ')});\n`;
            }
            sqlDump += `\n`;
        } else {
            sqlDump += `-- (Table [${table}] has 0 records)\n\n`;
        }
    }

    return sqlDump;
};

// Create a new backup (No file limit - all backups are preserved)
const createBackup = async (req, res) => {
    try {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        const fileName = `${BACKUP_PREFIX}_${timestamp}.sql`;
        const filePath = path.join(BACKUP_DIR, fileName);

        const dumpSql = await generateDatabaseDump();
        fs.writeFileSync(filePath, dumpSql, 'utf-8');

        const stats = fs.statSync(filePath);

        res.status(201).json({
            message: 'Database backup created successfully!',
            file: {
                name: fileName,
                size: `${(stats.size / 1024).toFixed(2)} KB`,
                date: stats.mtime.toLocaleString('en-IN')
            }
        });
    } catch (error) {
        console.error('Create backup error:', error);
        res.status(500).json({ error: error.message || 'Failed to create database backup' });
    }
};

// List existing backup files
const listBackups = (req, res) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            return res.json([]);
        }

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith(BACKUP_PREFIX) && f.endsWith('.sql'))
            .map(f => {
                const filePath = path.join(BACKUP_DIR, f);
                const stats = fs.statSync(filePath);
                return {
                    name: f,
                    size: `${(stats.size / 1024).toFixed(2)} KB`,
                    date: stats.mtime.toLocaleString('en-IN'),
                    timestamp: stats.mtimeMs
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp); // Newest first

        res.json(files);
    } catch (error) {
        console.error('List backups error:', error);
        res.status(500).json({ error: 'Failed to list backup files' });
    }
};

// Download a specific backup file
const downloadBackup = (req, res) => {
    try {
        const { filename } = req.params;
        // Security check: only allow alphanumerics, underscores, hyphens, and .sql extension
        if (!/^[a-zA-Z0-9_\-]+\.sql$/.test(filename)) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Backup file not found' });
        }

        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.download(filePath, filename);
    } catch (error) {
        console.error('Download backup error:', error);
        res.status(500).json({ error: 'Failed to download backup file' });
    }
};

// Delete a backup file
const deleteBackup = (req, res) => {
    try {
        const { filename } = req.params;
        if (!/^[a-zA-Z0-9_\-]+\.sql$/.test(filename)) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Backup file not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ message: `Backup "${filename}" deleted successfully.` });
    } catch (error) {
        console.error('Delete backup error:', error);
        res.status(500).json({ error: 'Failed to delete backup file' });
    }
};

module.exports = {
    createBackup,
    listBackups,
    downloadBackup,
    deleteBackup
};
