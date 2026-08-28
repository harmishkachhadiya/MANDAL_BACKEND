const sql = require('mssql');

require('dotenv').config();

const [server, instanceName] = (process.env.SQL_SERVER || '').split('\\', 2);
const port = process.env.SQL_PORT ? Number(process.env.SQL_PORT) : undefined;

const config = {
    server,
    ...(port ? { port } : {}),
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    connectionTimeout: Number(process.env.SQL_CONNECTION_TIMEOUT || 15000),
    options: {
        ...(instanceName && !port ? { instanceName } : {}),
        encrypt: process.env.SQL_ENCRYPT === 'true',
        trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE === 'true'
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL Database');
        return pool;
    })
    .catch(err => {
        console.log('Database Connection Failed! Bad Config: ', err);
        process.exit(1);
    });

/**
 * Execute a stored procedure
 * @param {string} procedureName - The name of the stored procedure
 * @param {Array} params - Array of parameter objects {name, type, value, isOutput}
 */
const executeSP = async (procedureName, params = []) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        params.forEach(p => {
            if (p.isOutput) {
                request.output(p.name, p.type, p.value);
            } else {
                request.input(p.name, p.type, p.value);
            }
        });

        const result = await request.execute(procedureName);
        return result;
    } catch (err) {
        console.error(`Error executing SP ${procedureName}:`, err);
        throw err;
    }
};

/**
 * Execute raw SQL query
 */
const querySQL = async (queryStr, params = []) => {
    try {
        const pool = await poolPromise;
        const request = pool.request();

        params.forEach(p => {
            request.input(p.name, p.type, p.value);
        });

        const result = await request.query(queryStr);
        return result;
    } catch (err) {
        console.error(`Error executing query:`, err);
        throw err;
    }
};

module.exports = {
    sql,
    poolPromise,
    executeSP,
    querySQL
};
