import { query } from '../server/db/connection.js';
import fs from 'fs';

async function listMenu() {
  try {
    const res = await query("SELECT name, code, route FROM emr.menu_item ORDER BY name");
    fs.writeFileSync('./menu_items_list.json', JSON.stringify(res.rows, null, 2));
    console.log('Menu items dumped to menu_items_list.json');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

listMenu();
