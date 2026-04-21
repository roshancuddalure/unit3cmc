import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { loadEnv } from "../config/env";
import { query } from "../db/query";

async function seed(): Promise<void> {
  const env = loadEnv();

  await query(
    env,
    `
      insert into units (id, code, name)
      values ($1, $2, $3)
      on conflict (code)
      do update set name = excluded.name
    `,
    [randomUUID(), env.DEFAULT_UNIT_CODE, env.DEFAULT_UNIT_NAME]
  );

  for (const [key, name] of [
    ["super_admin", "Super Admin"],
    ["unit_admin_or_faculty", "Unit Admin / Faculty"],
    ["postgraduate", "Postgraduate"],
    ["reviewer", "Reviewer"]
  ]) {
    await query(
      env,
      `
        insert into roles (id, key, name)
        values ($1, $2, $3)
        on conflict (key)
        do update set name = excluded.name
      `,
      [randomUUID(), key, name]
    );
  }

  const adminHash = await bcrypt.hash(env.BOOTSTRAP_ADMIN_PASSWORD, 10);
  await query(
    env,
    `
      insert into users (id, unit_id, role_id, username, name, display_name, email, password_hash, status, must_change_password, approved_at)
      values (
        $1,
        (select id from units where code = $2),
        (select id from roles where key = 'super_admin'),
        $3,
        $4,
        $5,
        $4,
        $6,
        'active',
        false,
        current_timestamp
      )
      on conflict (username)
      do update set
        email = excluded.email,
        username = excluded.username,
        name = excluded.name,
        display_name = excluded.display_name,
        password_hash = excluded.password_hash,
        status = 'active',
        must_change_password = false,
        approved_at = coalesce(users.approved_at, current_timestamp)
    `,
    [
      randomUUID(),
      env.DEFAULT_UNIT_CODE,
      env.BOOTSTRAP_ADMIN_USERNAME,
      env.BOOTSTRAP_ADMIN_NAME,
      env.BOOTSTRAP_ADMIN_EMAIL,
      adminHash
    ]
  );

  console.log(`Seed complete. Admin login: ${env.BOOTSTRAP_ADMIN_USERNAME}`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
