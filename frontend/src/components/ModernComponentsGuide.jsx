// ==================== GUIA DE USO: MODERNIZAR SUAS PÁGINAS ====================
//
// Este arquivo mostra como usar os novos componentes modernos no seu projeto.
// Siga este padrão para atualizar todas as páginas.
//

import { Button } from './ModernButton';
import { Card, CardHeader, CardBody, CardFooter } from './ModernCard';
import { Input, Checkbox } from './ModernForm';
import { Alert, Badge } from './ModernAlert';

// ==================== EXEMPLO 1: PÁGINA DE LOGIN MODERNIZADA ====================

export const LoginModerno = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      
      {/* Container Principal */}
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">Prontuário Pessoal</h1>
          <p className="text-dark-600">Sistema seguro de saúde integrado com IA</p>
        </div>

        {/* Card de Login */}
        <Card className="shadow-2xl">
          <CardBody>
            
            {/* Toggle Tipo Usuário */}
            <div className="flex gap-2 mb-6 bg-dark-100 p-1 rounded-lg">
              <button className="flex-1 btn-ghost py-2 text-sm bg-white rounded-md">
                👤 Paciente
              </button>
              <button className="flex-1 btn-ghost py-2 text-sm">
                👨‍⚕️ Profissional
              </button>
            </div>

            {/* Formulário */}
            <Input 
              label="Email" 
              type="email" 
              placeholder="seu@email.com"
              icon="✉️"
            />

            <Input 
              label="Senha" 
              type="password" 
              placeholder="••••••••"
              icon="🔒"
            />

            <Checkbox label="Manter-me conectado" className="mb-6" />

            {/* Botões */}
            <Button fullWidth className="mb-3">
              Entrar
            </Button>

            <Button fullWidth variant="secondary">
              Criar Conta
            </Button>

            {/* Link */}
            <p className="text-center text-sm text-dark-600 mt-4">
              Esqueceu a senha? <a href="#" className="text-primary-600 font-semibold hover:underline">Clique aqui</a>
            </p>

          </CardBody>
        </Card>

      </div>
    </div>
  );
};

// ==================== EXEMPLO 2: DASHBOARD MODERNIZADO ====================

export const DashboardModerno = () => {
  return (
    <div className="container-main">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2">Bem-vindo de volta! 👋</h1>
        <p className="text-dark-600">Aqui está um resumo da sua saúde</p>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Card Estatística */}
        <Card className="text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-3xl font-bold text-primary-600 mb-1">12</h3>
          <p className="text-dark-600 text-sm">Registros Médicos</p>
        </Card>

        <Card className="text-center">
          <div className="text-4xl mb-3">🤝</div>
          <h3 className="text-3xl font-bold text-accent-600 mb-1">3</h3>
          <p className="text-dark-600 text-sm">Profissionais Autorizados</p>
        </Card>

        <Card className="text-center">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="text-3xl font-bold text-blue-600 mb-1">5</h3>
          <p className="text-dark-600 text-sm">Mensagens Não Lidas</p>
        </Card>

        <Card className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-3xl font-bold text-yellow-600 mb-1">1</h3>
          <p className="text-dark-600 text-sm">Alerta de IA</p>
        </Card>

      </div>

      {/* Alert */}
      <Alert 
        type="info"
        title="Novo Insight Disponível"
        message="A IA analisou seus últimos registros e criou um novo insight."
        className="mb-6"
      />

      {/* Seção de Registros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna Principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3>Últimos Registros</h3>
            </CardHeader>
            <CardBody>
              {/* Table */}
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 bg-dark-50 rounded-lg hover:bg-dark-100 transition-colors">
                    <div flex="col">
                      <p className="font-semibold text-dark-900">Exame #{i}</p>
                      <p className="text-sm text-dark-500">15 dias atrás</p>
                    </div>
                    <Badge variant="success">Completo</Badge>
                  </div>
                ))}
              </div>
            </CardBody>
            <CardFooter>
              <Button fullWidth variant="secondary">Ver Todos os Registros</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          
          <Card>
            <CardHeader>
              <h4>Ações Rápidas</h4>
            </CardHeader>
            <CardBody className="space-y-2">
              <Button fullWidth size="sm">➕ Adicionar Registro</Button>
              <Button fullWidth size="sm" variant="secondary">👁️ Meus Registros</Button>
              <Button fullWidth size="sm" variant="secondary">🤖 Ver Insights IA</Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h4>Permissões Ativas</h4>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                <div className="text-sm">
                  <p className="font-semibold">Dr. Silva</p>
                  <Badge variant="primary" size="sm">Leitura</Badge>
                </div>
              </div>
            </CardBody>
          </Card>

        </div>

      </div>

    </div>
  );
};

// ==================== COMO USAR ====================
/*

1. IMPORTE os componentes no seu arquivo:
   import { Button, Card, Input, Alert, Badge } from './components/Modern*';

2. USE nos seu JSX recém os componentes:
   <Button variant="primary">Clique aqui</Button>
   <Card><p>Conteúdo</p></Card>
   <Input label="Email" type="email" />

3. PERSONALIZE com props:
   <Button size="lg" isLoading={true}>Enviar</Button>
   <Card interactive>Clicável</Card>
   <Alert type="success">Sucesso!</Alert>

4. COMBINE com Tailwind classes customizadas:
   <Button className="mb-4">Espaçamento</Button>
   <Card className="border-2 border-primary-500">Especial</Card>

5. VARIANTES DISPONÍVEIS:
   
   Button:
   - variant: primary | secondary | ghost | danger | success
   - size: sm | md | lg
   - isLoading: true | false
   - fullWidth: true | false

   Card:
   - interactive: true | false (hover effect)

   Alert:
   - type: info | success | warning | danger

   Badge:
   - variant: primary | success | warning | danger
   - size: sm | md | lg

   Input:
   - icon: string (emoji ou texto)
   - error: string (mensagem de erro)

*/
