import {checkStrengthSql} from './check-strength-memory-sql.mjs';
// Disposable Docker Postgres only. Never pass arbitrary connection strings to psql.
if(process.env.STRENGTH_TEST_DATABASE_URL){
 const url=new URL(process.env.STRENGTH_TEST_DATABASE_URL);
 if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw new Error('Strength database tests require a loopback host');
 throw new Error('This runner owns a disposable Docker database; omit STRENGTH_TEST_DATABASE_URL. No existing database will be reset.');
}
await checkStrengthSql('supabase/tests/strength-learning.test.sql');
