import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    try {
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');

        console.log('Running Schema...');
        await connection.query(schemaSql);
        console.log('Schema applied successfully.');

        console.log('Running Seed Data...');
        await connection.query(seedSql);
        console.log('Database seeded successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

runSeed();
