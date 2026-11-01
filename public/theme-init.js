// Aplica o tema escolhido em Mais → Aparência antes da primeira pintura, sem piscar no tema errado.
// Arquivo externo porque a CSP não permite script inline. Mesma chave de src/lib/theme.ts.
try {
  var t = localStorage.getItem('gastos:tema');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (e) {
  // Sem armazenamento: segue o sistema.
}
