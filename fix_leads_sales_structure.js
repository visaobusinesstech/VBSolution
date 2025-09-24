// Script para corrigir a estrutura do LeadsSales.tsx
const fs = require('fs');

const filePath = '/Users/guilhermemartins/Documents/1 - PROJECTS/VB Solution Project/Sistema/Atualizado/VBSolutionCRM-main/frontend/src/pages/LeadsSales.tsx';

// Ler o arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Corrigir a estrutura JSX
content = content.replace(
  /        \}\)\n      <\/div>\n\n      \{\/\* Botão flutuante de novo lead \*\/\}\n      <Button/g,
  `        )}
      </div>

      {/* Botão flutuante de novo lead */}
      <Button`
);

// Corrigir o fechamento do Fragment
content = content.replace(
  /      \}\)\n      <\/>\n    <\/div>\n  \);/,
  `      )}
      </>
    </div>
  );`
);

// Escrever o arquivo corrigido
fs.writeFileSync(filePath, content);

console.log('✅ Estrutura JSX corrigida!');
