# 🎨 GUIA DE MODERNIZAÇÃO DO DESIGN

## ✅ Passo 1: Configuração Completa

A configuração já foi feita via:
- ✓ tailwind.config.js (atualizado com cores e fontes modernas)
- ✓ index.css (com componentes globais e estilos úteis)
- ✓ App.css (animações e gradientes)

## ✅ Passo 2: Componentes Criados

Novos arquivos em `src/components/`:

```
ModernButton.jsx     → Botões com 5 variantes (primary, secondary, ghost, danger, success)
ModernCard.jsx       → Cards com header, body, footer
ModernForm.jsx       → Input, Select, Textarea, Checkbox
ModernAlert.jsx      → Alert e Badge
ModernComponentsGuide.jsx → Exemplos de uso
```

## 🎯 Passo 3: Como Usar em Cada Página

### **Para login.jsx:**

```javascript
import { Button } from '../components/ModernButton';
import { Card } from '../components/ModernCard';
import { Input, Checkbox } from '../components/ModernForm';
import { Alert } from '../components/ModernAlert';

export default function Login() {
  const [tipoUsuario, setTipoUsuario] = useState('paciente');
  const [isCadastro, setIsCadastro] = useState(false);
  const [mensagem, setMensagem] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Prontuário Pessoal</h1>
          <p className="text-dark-600">Sistema seguro integrado com IA</p>
        </div>

        {/* Card */}
        <Card className="shadow-2xl">
          {/* Toggle Tipo */}
          <div className="flex gap-2 mb-6 bg-dark-100 p-1 rounded-lg">
            <button 
              onClick={() => setTipoUsuario('paciente')}
              className={`flex-1 btn-ghost py-2 text-sm rounded-md transition-all ${
                tipoUsuario === 'paciente' ? 'bg-white text-primary-600' : ''
              }`}
            >
              👤 Paciente
            </button>
            <button 
              onClick={() => setTipoUsuario('profissional')}
              className={`flex-1 btn-ghost py-2 text-sm rounded-md transition-all ${
                tipoUsuario === 'profissional' ? 'bg-white text-primary-600' : ''
              }`}
            >
              👨‍⚕️ Profissional
            </button>
          </div>

          {/* Inputs */}
          <Input 
            label="Email" 
            type="email" 
            placeholder="seu@email.com"
            icon="✉️"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input 
            label="Senha" 
            type="password" 
            placeholder="••••••••"
            icon="🔒"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {!isCadastro && <Checkbox label="Manter-me conectado" className="mb-6" />}

          {/* Alert */}
          {mensagem && (
            <Alert 
              type={mensagem.includes('sucesso') ? 'success' : 'danger'}
              message={mensagem}
              onClose={() => setMensagem('')}
              className="mb-4"
            />
          )}

          {/* Botões */}
          <Button fullWidth className="mb-3" onClick={handleSubmit}>
            {isCadastro ? 'Criar Conta' : 'Entrar'}
          </Button>

          <Button fullWidth variant="secondary" onClick={() => setIsCadastro(!isCadastro)}>
            {isCadastro ? 'Voltar ao Login' : 'Não tem conta?'}
          </Button>
        </Card>

      </div>
    </div>
  );
}
```

### **Para dashboard.jsx:**

```javascript
import { Button } from '../components/ModernButton';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ModernCard';
import { Alert, Badge } from '../components/ModernAlert';

export default function Dashboard() {
  return (
    <div className="container-main">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2">Bem-vindo de volta! 👋</h1>
        <p className="text-dark-600">Aqui está um resumo da sua saúde</p>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-3xl font-bold text-primary-600">12</h3>
          <p className="text-dark-600 text-sm">Registros Médicos</p>
        </Card>
        {/* Mais cards... */}
      </div>

      {/* Alert */}
      {dados.alertas && (
        <Alert 
          type="warning"
          title="Novo Alerta"
          message={dados.alertas[0]}
          className="mb-6"
        />
      )}

      {/* Conteúdo Principal */}
      <Card>
        <CardHeader>
          <h3>Últimos Registros</h3>
        </CardHeader>
        <CardBody>
          {registros.map(r => (
            <div key={r.id} className="flex items-center justify-between p-4 bg-dark-50 rounded-lg hover:bg-dark-100">
              <div>
                <p className="font-semibold">{r.tipo}</p>
                <p className="text-sm text-dark-500">{r.data}</p>
              </div>
              <Badge variant="success">Completo</Badge>
            </div>
          ))}
        </CardBody>
        <CardFooter>
          <Button fullWidth variant="secondary">Ver Todos</Button>
        </CardFooter>
      </Card>

    </div>
  );
}
```

### **Para novoregistro.jsx:**

```javascript
import { Button } from '../components/ModernButton';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ModernCard';
import { Input, Select, Textarea } from '../components/ModernForm';
import { Alert } from '../components/ModernAlert';

export default function NovoRegistro() {
  return (
    <div className="container-main max-w-2xl">
      
      <div className="mb-8">
        <h1>➕ Criar Novo Registro</h1>
        <p className="text-dark-600">Adicione um novo prontuário médico</p>
      </div>

      <Card>
        <CardHeader>
          <h3>Informações do Registro</h3>
        </CardHeader>
        <CardBody className="space-y-5">
          
          <Select 
            label="Tipo de Registro"
            options={[
              { value: 'exame', label: '🔬 Exame' },
              { value: 'receita', label: '💊 Receita' },
              { value: 'laudo', label: '📋 Laudo' },
              { value: 'medicamento', label: '💉 Medicamento' },
            ]}
          />

          <Input label="Data" type="date" />

          <Input label="Órgão/Sistema Afetado" placeholder="Ex: Coração, Pulmão..." />

          <Textarea 
            label="Descrição Clínica"
            placeholder="Descreva os achados, resultados..."
            rows={5}
          />

          <Input label="Upload do Documento" type="file" />

        </CardBody>
        <CardFooter>
          <Button variant="secondary" fullWidth>Cancelar</Button>
          <Button variant="primary" fullWidth>Salvar Registro</Button>
        </CardFooter>
      </Card>

    </div>
  );
}
```

## 📋 Checklist de Modernização

### Pages a Atualizar:
- [ ] login.jsx
- [ ] dashboard.jsx
- [ ] DashboardProfissional.jsx
- [ ] novoregistro.jsx
- [ ] MeusRegistros.jsx
- [ ] Chat.jsx
- [ ] InsightsIA.jsx
- [ ] Permissoes.jsx
- [ ] Auditoria.jsx
- [ ] Visualizador.jsx

## 🎨 Paleta de Cores Disponível

```
Primária:  #5b7dff (azul moderno)
Accent:    #22c55e (verde sucesso)
Dark:      #111827 (cinza escuro)
Light:     #f9fafb (branco)
Border:    #e5e7eb (cinza leve)
```

## 🧪 Classes Úteis do Tailwind

```
Gradientes:
- gradient-primary → azul moderno
- gradient-accent → verde moderno
- gradient-success → combinação
- bg-gradient-to-br from-primary-50 via-white to-accent-50

Sombras:
- shadow-md → sutil
- shadow-lg → média
- shadow-xl → forte
- shadow-glow → brilho azul

Animações:
- animate-fade-in → entrada suave
- animate-slide-in → deslize
- animate-pulse-soft → pulsação leve

Espaçamento:
- container-main → max-width com padding

Tipografia:
- font-display → Poppins (títulos)
- font-sans → Inter (corpo)
```

## 🚀 Próximas Etapas

1. **Importe os componentes** em cada página
2. **Substitua o HTML antigo** pelos componentes modernos
3. **Ajuste cores** usando as classes do Tailwind
4. **Teste responsividade** em mobile
5. **Adicione animações** com animate-* classes

## 💡 Dicas

- Use `className="mb-4"` para espaçamento consistente
- Combine variantes: `<Button variant="primary" size="lg">`
- Componentes já têm hover e focus states
- Gradientes funcionam em desktop e mobile

Pronto! Seu projeto agora tem design moderno e profissional! 🎉
