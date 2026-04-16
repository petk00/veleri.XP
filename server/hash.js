const bcrypt = require('bcryptjs');

async function run() {
  const hash = await bcrypt.hash('123', 10);
  console.log(hash);
}

run();