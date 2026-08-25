import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/common/components/StatusCard.jsx', import.meta.url), {
  encoding: 'utf8',
});

test('react-rnd excludes all minimize, expand and close controls from drag handling', () => {
  assert.match(source, /cancel="\.status-card-no-drag"/);

  const controls = [
    'Minimizar detalhes do veículo',
    'Expandir detalhes do veículo',
    'Fechar detalhes do veículo',
  ];

  for (const label of controls) {
    const buttonPattern = new RegExp(
      `<IconButton[\\s\\S]{0,200}className="status-card-no-drag"[\\s\\S]{0,200}aria-label="${label}"`,
    );
    assert.match(source, buttonPattern);
  }
});

test('drag remains restricted to the card header', () => {
  assert.match(source, /dragHandleClassName="draggable-header"/);
});
