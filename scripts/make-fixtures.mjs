// Gera as planilhas de fixture dos testes: node scripts/make-fixtures.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import writeXlsxFile from 'write-excel-file/universal';

const out = new URL('../tests/fixtures/', import.meta.url);
await mkdir(out, { recursive: true });

const d = (s) => {
  const [y, m, day] = s.split('-').map(Number);
  return { value: new Date(Date.UTC(y, m - 1, day)), type: Date, format: 'dd/mm/yyyy' };
};
const num = (v) => ({ value: v, type: Number, format: '#,##0.00' });
const txt = (v) => ({ value: v, type: String });

async function save(name, data) {
  const blob = await writeXlsxFile(data, { sheet: 'Gastos' }).toBlob();
  await writeFile(new URL(name, out), Buffer.from(await blob.arrayBuffer()));
  console.log('ok', name);
}

// CA-15: 20 linhas de dados = 2 em branco + 1 com data inválida + 17 válidas (1 com categoria desconhecida).
// Colunas fora da ordem padrão e cabeçalho com acento, para exercitar a localização pelo nome.
const header = [txt('Valor (R$)'), txt('Categoria'), txt('Data'), txt('Descrição')];
const valid = [
  ['2026-10-01', 'Alimentação', 25.9, 'Almoço'],
  ['2026-10-01', 'Mercado', 184.37, 'Compras da semana'],
  ['2026-10-02', 'Transporte', 4.4, 'Ônibus'],
  ['2026-10-03', 'Papelaria', 15, 'Cadernos'], // categoria desconhecida → Outros
  ['2026-10-04', 'Moradia', 1500, 'Aluguel'],
  ['2026-10-05', 'carro', 220, 'Gasolina'],
  ['2026-10-06', 'SAÚDE', 89.9, 'Farmácia'],
  ['2026-10-07', 'Educação', 350, 'Curso'],
  ['2026-10-08', 'Lazer', 60, 'Cinema'],
  ['2026-10-09', 'Jogos', 129.99, 'Jogo novo'],
  ['2026-10-10', 'Vestuário', 199.9, 'Tênis'],
  ['2026-10-11', 'Família', 80, 'Presente'],
  ['2026-10-12', 'Outros', 12.5, 'Diversos'],
  ['2026-10-13', 'Alimentação', 42, 'Jantar'],
  ['2026-10-14', 'Mercado', 76.45, 'Feira'],
  ['2026-10-15', 'Transporte', 33.2, 'App de corrida'],
  ['2026-10-16', 'Lazer', 25, 'Parque'],
];
const rows = valid.map(([date, cat, value, desc]) => [num(value), txt(cat), d(date), txt(desc)]);
rows.splice(4, 0, [null, null, null, null]); // em branco
rows.splice(10, 0, [num(10), txt('Mercado'), txt('31/02/2026'), txt('Data impossível')]); // data inválida
rows.splice(15, 0, [null, null, null, null]); // em branco
if (rows.length !== 20) throw new Error(`esperava 20 linhas, gerou ${rows.length}`);
await save('ca15-20-linhas.xlsx', [header, ...rows]);

await save('sem-colunas.xlsx', [
  [txt('Data'), txt('Descrição')],
  [d('2026-10-01'), txt('Almoço')],
]);

// Arquivo corrompido: bytes que não formam um .xlsx.
await writeFile(new URL('corrompido.xlsx', out), Buffer.from('isto não é uma planilha', 'utf8'));
console.log('ok corrompido.xlsx');
