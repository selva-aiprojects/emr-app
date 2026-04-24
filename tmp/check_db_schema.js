import { query } from '../server/db/connection.js';

async function checkSchema() {
  try {
    console.log('--- nhgl.patients columns ---');
    const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'nhgl' AND table_name = 'patients'");
    const cols = res.rows.map(r => r.column_name);
    console.log(JSON.stringify(res.rows, null, 2));
    
    console.log('--- emr.get_next_mrn exists? ---');
    const funcRes = await query("SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'emr' AND routine_name = 'get_next_mrn'");
    console.log(JSON.stringify(funcRes.rows, null, 2));

    console.log('--- nhgl.patients check for MRN constraint ---');
    const constRes = await query("SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_schema = 'nhgl' AND table_name = 'patients'");
    console.log(JSON.stringify(constRes.rows, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
