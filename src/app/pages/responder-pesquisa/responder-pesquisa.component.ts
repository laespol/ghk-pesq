import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PesquisaService, PesquisaPublicaResponse, PesquisaPergunta, RespostaPayload } from '../../services/pesquisa.service';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-responder-pesquisa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ProgressBarModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './responder-pesquisa.component.html',
  styleUrls: ['./responder-pesquisa.component.css']
})
export class ResponderPesquisaComponent implements OnInit {
  token: string = '';
  carregando: boolean = true;
  enviando: boolean = false;

  // Estados de tela
  telaRespondida: boolean = false;
  telaExpirada: boolean = false;
  telaErro: boolean = false;
  telaSucesso: boolean = false;
  mensagemErro: string = '';

  // Dados da Pesquisa
  pesquisa: any = null;
  perguntas: PesquisaPergunta[] = [];
  nomeCliente: string = '';
  textoConclusao: string = '';

  // Respostas preenchidas pelo usuário (map por id_pergunta)
  respostasMap: { [id_pergunta: number]: { valor_nota?: number | null; valor_opcao?: any; valor_texto?: string } } = {};
  tentouEnviar: boolean = false;

  readonly estrelasValores = [1, 2, 3, 4, 5];
  readonly estrelasLabels = ['', 'Muito Ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];
  readonly npsValores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor(
    private route: ActivatedRoute,
    private pesquisaService: PesquisaService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Tenta obter o token da rota ou query params
    this.route.paramMap.subscribe(params => {
      const tokenParam = params.get('token');
      if (tokenParam) {
        this.token = tokenParam;
        this.carregarPesquisa();
      } else {
        this.route.queryParamMap.subscribe(qParams => {
          const qToken = qParams.get('token');
          if (qToken) {
            this.token = qToken;
            this.carregarPesquisa();
          } else {
            this.carregando = false;
            this.telaErro = true;
            this.mensagemErro = 'Token de acesso não fornecido na URL. Verifique o link recebido por e-mail.';
          }
        });
      }
    });
  }

  carregarPesquisa(): void {
    this.carregando = true;
    this.telaErro = false;
    this.pesquisaService.obterPesquisaPorToken(this.token).subscribe({
      next: (res: PesquisaPublicaResponse) => {
        this.carregando = false;
        if (res.respondida) {
          this.telaRespondida = true;
          this.pesquisa = { titulo: res.titulo };
          this.nomeCliente = res.nome_cliente || '';
          this.textoConclusao = res.texto_conclusao || '';
          return;
        }

        if (res.expirada) {
          this.telaExpirada = true;
          this.mensagemErro = res.message || 'Esta pesquisa já foi encerrada.';
          return;
        }

        if (res.ok && res.dados) {
          this.pesquisa = res.dados;
          this.perguntas = res.dados.perguntas || [];
          this.nomeCliente = res.dados.nome_cliente || '';
          this.textoConclusao = res.dados.texto_conclusao || '';

          // Inicializa mapa de respostas
          this.perguntas.forEach(p => {
            this.respostasMap[p.id_pergunta] = {
              valor_nota: null,
              valor_opcao: p.tipo === 'MULTIPLA_ESCOLHA' ? [] : null,
              valor_texto: ''
            };
          });
        } else {
          this.telaErro = true;
          this.mensagemErro = res.message || 'Não foi possível carregar a pesquisa.';
        }
      },
      error: (err) => {
        this.carregando = false;
        this.telaErro = true;
        this.mensagemErro = err.error?.message || 'Link inválido ou pesquisa expirada.';
      }
    });
  }

  // NPS
  selecionarNps(idPergunta: number, valor: number): void {
    this.respostasMap[idPergunta].valor_nota = valor;
  }

  // Estrelas
  selecionarEstrela(idPergunta: number, valor: number): void {
    this.respostasMap[idPergunta].valor_nota = valor;
  }

  // Opção Única / Sim-Não
  selecionarOpcaoUnica(idPergunta: number, valor: string): void {
    this.respostasMap[idPergunta].valor_opcao = valor;
  }

  // Múltipla Escolha
  toggleMultiplaEscolha(idPergunta: number, opcao: string): void {
    let selecionadas: string[] = this.respostasMap[idPergunta].valor_opcao || [];
    if (!Array.isArray(selecionadas)) {
      selecionadas = [];
    }
    const idx = selecionadas.indexOf(opcao);
    if (idx > -1) {
      selecionadas.splice(idx, 1);
    } else {
      selecionadas.push(opcao);
    }
    this.respostasMap[idPergunta].valor_opcao = [...selecionadas];
  }

  isOpcaoSelecionada(idPergunta: number, opcao: string): boolean {
    const r = this.respostasMap[idPergunta]?.valor_opcao;
    if (Array.isArray(r)) {
      return r.includes(opcao);
    }
    return r === opcao;
  }

  // Progresso
  get progressoPorcentagem(): number {
    if (!this.perguntas.length) return 0;
    let respondidas = 0;
    for (const p of this.perguntas) {
      if (this.isPerguntaRespondida(p)) {
        respondidas++;
      }
    }
    return Math.round((respondidas / this.perguntas.length) * 100);
  }

  isPerguntaRespondida(p: PesquisaPergunta): boolean {
    const r = this.respostasMap[p.id_pergunta];
    if (!r) return false;

    if (p.tipo === 'NOTA_0_10' || p.tipo === 'ESTRELAS_1_5') {
      return r.valor_nota !== null && r.valor_nota !== undefined;
    }
    if (p.tipo === 'ESCOLHA_UNICA' || p.tipo === 'SELECAO_UNICA' || p.tipo === 'SIM_NAO') {
      return !!r.valor_opcao;
    }
    if (p.tipo === 'MULTIPLA_ESCOLHA') {
      return Array.isArray(r.valor_opcao) && r.valor_opcao.length > 0;
    }
    if (p.tipo === 'TEXTO_LIVRE' || p.tipo === 'TEXTO') {
      return !!(r.valor_texto && r.valor_texto.trim().length > 0);
    }
    return false;
  }

  validarFormulario(): boolean {
    for (const p of this.perguntas) {
      if (p.requerido && !this.isPerguntaRespondida(p)) {
        return false;
      }
    }
    return true;
  }

  enviarRespostas(): void {
    this.tentouEnviar = true;

    if (!this.validarFormulario()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos Obrigatórios',
        detail: 'Por favor, responda todas as perguntas obrigatórias marcadas com * antes de enviar.'
      });
      return;
    }

    const payload: RespostaPayload[] = this.perguntas.map(p => {
      const r = this.respostasMap[p.id_pergunta];
      return {
        id_pergunta: p.id_pergunta,
        valor_nota: r?.valor_nota,
        valor_opcao: r?.valor_opcao,
        valor_texto: r?.valor_texto
      };
    });

    this.enviando = true;
    this.pesquisaService.enviarRespostas(this.token, payload).subscribe({
      next: (res) => {
        this.enviando = false;
        this.telaSucesso = true;
      },
      error: (err) => {
        this.enviando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao Enviar',
          detail: err.error?.message || 'Ocorreu um erro ao registrar sua resposta. Tente novamente.'
        });
      }
    });
  }
}
