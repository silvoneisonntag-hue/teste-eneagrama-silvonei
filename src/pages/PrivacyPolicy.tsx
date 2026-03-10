import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/auth">
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </Link>

        <div className="bg-card rounded-2xl border border-border p-8 shadow-[var(--shadow-soft)] space-y-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">Política de Privacidade</h1>
          <p className="text-xs text-muted-foreground font-body">Última atualização: 10 de março de 2026</p>

          <div className="space-y-5 text-sm text-foreground/90 font-body leading-relaxed">
            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-2">1. Dados Coletados</h2>
              <p>Coletamos as seguintes informações pessoais quando você se cadastra e utiliza nossa plataforma:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Telefone / WhatsApp (opcional)</li>
                <li>Respostas da entrevista de Eneagrama</li>
                <li>Resultados e relatórios gerados</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-2">2. Finalidade do Tratamento</h2>
              <p>Seus dados são utilizados exclusivamente para:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Criação e gerenciamento da sua conta</li>
                <li>Realização da análise de Eneagrama personalizada</li>
                <li>Geração de relatórios em PDF</li>
                <li>Envio de relatórios por WhatsApp (quando solicitado)</li>
                <li>Comunicação sobre seus resultados e atualizações do serviço</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-2">3. Base Legal (LGPD – Lei nº 13.709/2018)</h2>
              <p>O tratamento dos seus dados pessoais é realizado com base no seu <strong>consentimento</strong>, fornecido no momento do cadastro, conforme o Art. 7º, inciso I da LGPD.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-2">4. Compartilhamento de Dados</h2>
              <p>Seus dados pessoais <strong>não são compartilhados, vendidos ou alugados</strong> a terceiros. Os dados são acessados apenas pelo administrador da plataforma para fins de suporte e geração de relatórios.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-2">5. Armazenamento e Segurança</h2>
              <p>Os dados são armazenados em servidores seguros com criptografia e controle de acesso. Adotamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, perda ou destruição.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-2">6. Seus Direitos</h2>
              <p>Conforme a LGPD, você tem direito a:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Confirmar a existência do tratamento dos seus dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar a exclusão dos seus dados</li>
                <li>Revogar o consentimento a qualquer momento</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-2">7. Contato</h2>
              <p>Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados, entre em contato conosco pelo e-mail disponibilizado na plataforma.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-2">8. Alterações nesta Política</h2>
              <p>Esta política pode ser atualizada periodicamente. Quaisquer mudanças significativas serão comunicadas através da plataforma.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
