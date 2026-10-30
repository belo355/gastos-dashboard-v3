export type AppErrorCode =
  | 'storage_unavailable'
  | 'storage_quota'
  | 'wallet_name_taken'
  | 'invalid_name'
  | 'invalid_input'
  | 'not_found'
  | 'import_unreadable'
  | 'import_missing_columns'
  | 'import_duplicate_month'
  | 'import_too_large'
  | 'import_empty'
  | 'export_failed';

export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  storage_unavailable: 'Não foi possível salvar no aparelho. Tente de novo.',
  storage_quota: 'O espaço do aparelho acabou. Exporte e apague meses antigos.',
  wallet_name_taken: 'Já existe uma carteira com esse nome',
  invalid_name: 'Informe o nome da carteira',
  invalid_input: 'Confira os dados informados.',
  not_found: 'Item não encontrado. Ele pode ter sido apagado.',
  import_unreadable: 'Não foi possível ler a planilha.',
  import_missing_columns: 'A planilha não tem as colunas obrigatórias.',
  import_duplicate_month: 'Duas planilhas do mesmo mês.',
  import_too_large: 'Arquivo grande demais (máximo de 5 MB e 10.000 linhas).',
  import_empty: 'Nenhuma despesa encontrada nesta planilha.',
  export_failed: 'Não foi possível gerar o arquivo. Tente de novo.',
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details?: readonly string[];

  constructor(
    code: AppErrorCode,
    options?: { message?: string; details?: readonly string[]; cause?: unknown },
  ) {
    super(options?.message ?? ERROR_MESSAGES[code], { cause: options?.cause });
    this.name = 'AppError';
    this.code = code;
    this.details = options?.details;
  }

  toJSON() {
    return { error: { code: this.code, message: this.message } };
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

/** Mensagem pronta para o usuário a partir de qualquer erro. */
export function errorMessage(e: unknown): string {
  return isAppError(e) ? e.message : ERROR_MESSAGES.storage_unavailable;
}
