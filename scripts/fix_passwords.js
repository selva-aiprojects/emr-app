
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function updatePassword(email, hash) {
    try {
        const res = await pool.query(
            'UPDATE emr.users SET password_hash = $1 WHERE LOWER(email) = LOWER($2) RETURNING name',
            [hash, email]
        );
        if (res.rowCount > 0) {
            console.log(`Updated password for ${res.rows[0].name} (${email})`);
        } else {
            console.log(`User not found: ${email}`);
        }
    } catch (err) {
        console.error(`Error updating ${email}:`, err.message);
    }
}

async function run() {
    console.log('Fixing passwords in database...');

    // Hashes generated with bcrypt (cost 10)
    const updates = [
        { email: 'superadmin@emr.local', hash: '$2b$10$FcVQCWWQygaoMFboyBaC3eGVl7PSfA/Rq2Yq.Q3atM95O90BKMaWe' },
        { email: 'anita@sch.local', hash: '$2b$10$4NC1RsZX9oeNe0FZjntndOSL/DfVcJVtgZmxYORODl0lQ9dKp2Sra' },
        { email: 'rajesh@sch.local', hash: '$2b$10$lqdW0xi8Y08I3wBDAX/s6uTxBI9YiywcgzTP31/GxVePldecUqU1O' },
        { email: 'priya@sch.local', hash: '$2b$10$PuQajGkxYhwM4Mq2SOmkauLxBy.JAXNu.bEVCSvgSxQiFEbWzgENC' },
        { email: 'suresh@sch.local', hash: '$2b$10$zNdT0UL70FHVwMWTjnTv1Om0sjlqOEDBGuhfUe2Mu5tdhxwYKUKWS' },
        { email: 'lakshmi@sch.local', hash: '$2b$10$4GzqOBBlrrdPptnK1enSnul/uAxzLWGWb2NkghRkU9eJvrU1JHk2.' },
        { email: 'meena@sch.local', hash: '$2b$10$TJo.bwTSs9lkQpzCoLkXReEpWproMOvyP37XGvdxbBbf58N2DbfbK' },
        { email: 'admin@nhc.local', hash: '$2b$10$FcVQCWWQygaoMFboyBaC3eGVl7PSfA/Rq2Yq.Q3atM95O90BKMaWe' },
        { email: 'doctor@nhc.local', hash: '$2b$10$lqdW0xi8Y08I3wBDAX/s6uTxBI9YiywcgzTP31/GxVePldecUqU1O' },
        { email: 'admin@rcc.local', hash: '$2b$10$FcVQCWWQygaoMFboyBaC3eGVl7PSfA/Rq2Yq.Q3atM95O90BKMaWe' },
        { email: 'nurse@rcc.local', hash: '$2b$10$aLK/75ZGX7G8UzKkwOYZs.KFW6cXrJBgUlRcDw1BONMgamGT.6ePG' },
        { email: 'admin@omega.local', hash: '$2b$10$FcVQCWWQygaoMFboyBaC3eGVl7PSfA/Rq2Yq.Q3atM95O90BKMaWe' },
        { email: 'doctor@omega.local', hash: '$2b$10$0koFHhJWbV9b5q.ZwzGVuOtve0VzllCM26gdb7ZUAX6nL/a0YlWji' }
    ];

    for (const u of updates) {
        await updatePassword(u.email, u.hash);
    }

    console.log('Done.');
    await pool.end();
}

run();
