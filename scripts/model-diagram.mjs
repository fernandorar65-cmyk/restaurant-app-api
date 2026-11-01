// Generates docs/modelo-tablas/modelo-bd.svg from the live schema of a
// database built by the migrations, so the diagram can't drift from the
// model. Usage: DB_DATABASE=<migrated db> node scripts/model-diagram.mjs
// (the PNG is a 2x render of the SVG, see the README of docs/modelo-tablas).
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import pg from 'pg';

const CONTEXTS = [
  {
    name: 'IAM',
    color: '#4f46e5',
    tables: [
      'users',
      'customer_profiles',
      'roles',
      'permissions',
      'role_permissions',
      'organization_memberships',
      'membership_restaurants',
    ],
    support: ['refresh_tokens', 'password_reset_tokens'],
    note: 'de soporte de auth',
  },
  {
    name: 'Organizations',
    color: '#0891b2',
    tables: [
      'organizations',
      'restaurants',
      'restaurant_floors',
      'dining_tables',
      'work_areas',
      'job_positions',
      'employees',
    ],
  },
  {
    name: 'Catalog',
    color: '#16a34a',
    tables: [
      'categories',
      'products',
      'product_categories',
      'menus',
      'menu_sections',
      'menu_products',
      'product_ingredients',
    ],
  },
  {
    name: 'Attention',
    color: '#ea580c',
    tables: [
      'attention_statuses',
      'order_statuses',
      'service_types',
      'attentions',
      'attention_participants',
      'fulfillments',
      'orders',
      'order_items',
      'order_item_status_history',
    ],
  },
  {
    name: 'Payments',
    color: '#db2777',
    tables: [
      'payment_statuses',
      'payments',
      'payment_allocations',
      'payment_provider_status_mappings',
      'payment_provider_events',
      'refund_statuses',
      'refunds',
      'refund_allocations',
      'refund_provider_status_mappings',
    ],
  },
  {
    name: 'Inventory',
    color: '#9333ea',
    tables: [
      'units_of_measure',
      'inventory_movement_types',
      'inventory_categories',
      'supplies',
      'restaurant_supplies',
      'inventory_movements',
      'product_recipes',
    ],
  },
  {
    name: 'Finance',
    color: '#ca8a04',
    tables: [
      'expense_categories',
      'expenses',
      'daily_closures',
      'daily_closure_payment_totals',
    ],
  },
  {
    name: 'Observability',
    color: '#475569',
    tables: [],
    support: ['error_logs'],
    note: 'técnica, fuera del modelo de negocio',
  },
];

const WIDTH = 2284;
const COLUMNS = 5;
const BOX = 420;
const GAP = 26;
const ROW = 19;
const HEADER = 30;

const client = new pg.Client({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'restaurant_api',
});
await client.connect();

const rows = async (sql) => (await client.query(sql)).rows;
const columns = await rows(`
  SELECT c.relname AS table, a.attname AS column, a.attnum AS position,
         format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS not_null
  FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped
    AND c.relname <> 'migrations'
  ORDER BY c.relname, a.attnum`);
const constraints = await rows(`
  SELECT c.relname AS table, k.contype AS type, k.conkey AS columns, f.relname AS target
  FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_class f ON f.oid = k.confrelid
  WHERE n.nspname = 'public' AND c.relname <> 'migrations'`);
const uniqueIndexes = await rows(`
  SELECT c.relname AS table, i.indkey::int2[] AS columns
  FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND i.indisunique AND NOT i.indisprimary AND c.relname <> 'migrations'`);
const [{ count: indexCount }] = await rows(
  `SELECT count(*)::int FROM pg_indexes WHERE schemaname = 'public' AND tablename <> 'migrations'`,
);
await client.end();

const shortType = (type) =>
  type
    .replace('character varying', 'varchar')
    .replace('timestamp with time zone', 'timestamptz')
    .replace('integer', 'int')
    .replace('character(', 'char(');
const tables = new Map();
for (const column of columns) {
  if (!tables.has(column.table)) tables.set(column.table, []);
  tables.get(column.table).push({ ...column, type: shortType(column.type) });
}
const mark = (table, positions, apply) => {
  for (const position of positions) {
    const column = tables
      .get(table)
      ?.find((candidate) => candidate.position === position);
    if (column) apply(column);
  }
};
for (const constraint of constraints) {
  if (constraint.type === 'p')
    mark(constraint.table, constraint.columns, (c) => (c.pk = true));
  if (constraint.type === 'f')
    mark(
      constraint.table,
      constraint.columns,
      (c) => (c.fk = constraint.target),
    );
  if (constraint.type === 'u')
    mark(constraint.table, constraint.columns, (c) => (c.uq = true));
}
for (const index of uniqueIndexes) {
  mark(index.table, index.columns, (c) => (c.uq = true));
}

const modelTables = CONTEXTS.flatMap((context) => context.tables);
const supportTables = CONTEXTS.flatMap((context) => context.support ?? []);
const known = new Set([...modelTables, ...supportTables]);
const unknown = [...tables.keys()].filter((table) => !known.has(table));
const missing = [...known].filter((table) => !tables.has(table));
if (unknown.length || missing.length) {
  throw new Error(
    `Context map out of date. Unknown: ${unknown}. Missing: ${missing}`,
  );
}
const fkCount = constraints.filter(
  (constraint) => constraint.type === 'f',
).length;
const checkCount = constraints.filter(
  (constraint) => constraint.type === 'c',
).length;

const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const out = [];
const badge = (x, y, label, fill, color) =>
  `<rect x="${x}" y="${y - 11}" width="22" height="14" rx="3" fill="${fill}"/><text x="${x + 11}" y="${y}" font-size="9" font-weight="700" text-anchor="middle" fill="${color}">${label}</text>`;

function box(table, x, y, color, dashed) {
  const cols = tables.get(table);
  const height = HEADER + cols.length * ROW + 10;
  out.push(
    `<g filter="url(#sh)"><rect x="${x}" y="${y}" width="${BOX}" height="${height}" rx="8" fill="#ffffff" stroke="${color}" stroke-opacity="0.55"${dashed ? ' stroke-dasharray="5 4"' : ''}/></g>`,
    `<path d="M${x} ${y + 8} a8 8 0 0 1 8 -8 h${BOX - 16} a8 8 0 0 1 8 8 v22 h-${BOX} z" fill="${color}"/>`,
    `<text x="${x + 12}" y="${y + 20}" font-size="14" font-weight="700" fill="#ffffff">${escape(table)}</text>`,
  );
  cols.forEach((column, index) => {
    const baseline = y + HEADER + 14 + index * ROW;
    if (index % 2 === 1) {
      out.push(
        `<rect x="${x + 1}" y="${baseline - 13}" width="${BOX - 2}" height="${ROW}" fill="#f1f5f9"/>`,
      );
    }
    if (column.pk) out.push(badge(x + 8, baseline, 'PK', '#fef3c7', '#b45309'));
    else if (column.fk)
      out.push(badge(x + 8, baseline, 'FK', '#dbeafe', '#1d4ed8'));
    if (column.uq && !column.pk)
      out.push(badge(x + 32, baseline, 'UQ', '#d1fae5', '#047857'));
    const bold = column.pk || column.fk ? 700 : 400;
    out.push(
      `<text x="${x + 58}" y="${baseline}" font-size="12" font-weight="${bold}" fill="#0f172a">${escape(column.column)}</text>`,
    );
    const right = column.fk
      ? `<tspan fill="#1d4ed8">→ ${escape(column.fk)}</tspan>  ${escape(column.type)}${column.not_null ? '  NN' : ''}`
      : `${escape(column.type)}${column.not_null ? '  NN' : ''}`;
    out.push(
      `<text x="${x + BOX - 10}" y="${baseline}" font-size="10" text-anchor="end" font-family="Menlo, monospace" fill="#64748b">${right}</text>`,
    );
  });
  return height;
}

let y = 120;
const sections = [];
for (const context of CONTEXTS) {
  const all = [
    ...context.tables.map((t) => [t, false]),
    ...(context.support ?? []).map((t) => [t, true]),
  ];
  const heights = Array(COLUMNS).fill(y + 34);
  const start = out.length;
  for (const [table, dashed] of all) {
    const column = heights.indexOf(Math.min(...heights));
    const height = box(
      table,
      40 + column * (BOX + GAP),
      heights[column],
      context.color,
      dashed,
    );
    heights[column] += height + 18;
  }
  const bottom = Math.max(...heights) + 4;
  const count = context.tables.length;
  const title =
    count === 0
      ? `${context.name} · ${context.support.length} tabla (${context.note})`
      : `${context.name} · ${count} tablas${context.support ? ` + ${context.support.length} ${context.note}` : ''}`;
  sections.push({
    index: start,
    svg: [
      `<rect x="26" y="${y}" width="${WIDTH - 52}" height="${bottom - y}" rx="14" fill="${context.color}" fill-opacity="0.05" stroke="${context.color}" stroke-opacity="0.25"/>`,
      `<text x="40" y="${y + 24}" font-size="17" font-weight="700" fill="${context.color}">${escape(title)}</text>`,
    ],
  });
  y = bottom + 30;
}
for (const section of sections.reverse()) {
  out.splice(section.index, 0, ...section.svg);
}

const total = tables.size;
const today = new Date().toLocaleDateString('es-PE', {
  timeZone: 'America/Lima',
});
const header = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${y}" viewBox="0 0 ${WIDTH} ${y}" font-family="Helvetica, Arial, sans-serif">`,
  `<defs><filter id="sh" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.10"/></filter></defs>`,
  `<rect width="100%" height="100%" fill="#f8fafc"/>`,
  `<text x="40" y="44" font-size="26" font-weight="700" fill="#0f172a">Restaurant CMR — Modelo de base de datos</text>`,
  `<text x="40" y="68" font-size="13" fill="#64748b">PostgreSQL · ${total} tablas (${modelTables.length} del modelo + 2 de soporte de auth + 1 técnica) · ${columns.length} columnas · ${fkCount} claves foráneas · ${checkCount} checks · ${indexCount} índices · generado el ${today} desde la base migrada</text>`,
  badge(40, 92, 'PK', '#fef3c7', '#b45309'),
  `<text x="68" y="92" font-size="12" fill="#475569">clave primaria</text>`,
  badge(300, 92, 'FK', '#dbeafe', '#1d4ed8'),
  `<text x="328" y="92" font-size="12" fill="#475569">clave foránea (→ tabla destino)</text>`,
  badge(560, 92, 'UQ', '#d1fae5', '#047857'),
  `<text x="588" y="92" font-size="12" fill="#475569">parte de una restricción única</text>`,
  `<text x="820" y="92" font-size="12" fill="#475569">NN = NOT NULL · borde punteado = tabla de soporte (auth) o técnica (logs), fuera del modelo de negocio</text>`,
];
writeFileSync(
  'docs/modelo-tablas/modelo-bd.svg',
  [...header, ...out, '</svg>', ''].join('\n'),
);
console.log(
  JSON.stringify({
    tables: total,
    model: modelTables.length,
    columns: columns.length,
    foreignKeys: fkCount,
    checks: checkCount,
    indexes: indexCount,
  }),
);
