import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PesquisaPergunta {
  id_pergunta: number;
  ordem: number;
  titulo: string;
  descricao?: string;
  tipo: 'NOTA_0_10' | 'ESTRELAS_1_5' | 'ESCOLHA_UNICA' | 'SELECAO_UNICA' | 'MULTIPLA_ESCOLHA' | 'SIM_NAO' | 'TEXTO_LIVRE' | 'TEXTO' | string;
  opcoes?: string[];
  requerido: boolean;
}

export interface PesquisaPublicaResponse {
  ok: boolean;
  respondida?: boolean;
  expirada?: boolean;
  message?: string;
  titulo?: string;
  nome_cliente?: string;
  produto_servico?: string;
  data_resposta?: string;
  texto_conclusao?: string;
  dados?: {
    id_pesquisa: number;
    titulo: string;
    descricao?: string;
    texto_introducao?: string;
    texto_conclusao?: string;
    nome_cliente: string;
    produto_servico?: string;
    perguntas: PesquisaPergunta[];
  };
}

export interface RespostaPayload {
  id_pergunta: number;
  valor_nota?: number | null;
  valor_opcao?: string | string[] | null;
  valor_texto?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PesquisaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obterPesquisaPorToken(token: string): Observable<PesquisaPublicaResponse> {
    return this.http.get<PesquisaPublicaResponse>(`${this.apiUrl}/publica/${token}`);
  }

  enviarRespostas(token: string, respostas: RespostaPayload[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/publica/${token}/responder`, { respostas });
  }
}
