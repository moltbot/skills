#!/usr/bin/env node
/**
 * Setup database schema for conversation summaries
 */

import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const DB_URL = process.env.SLACK_DB_URL;

async function setupSchema() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  try {
    console.log('Setting up conversation_summaries schema...');
    
    const schema = fs.readFileSync('schema.sql', 'utf8');
    await client.query(schema);
    
    console.log('✅ Schema setup complete!');
    
    // Test the schema
    const result = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'conversation_summaries'
      ORDER BY ordinal_position
    `);
    
    console.log(`\nCreated table with ${result.rows.length} columns:`);
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('Error setting up schema:', error);
    throw error;
  } finally {
    await client.end();
  }
}

setupSchema()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
