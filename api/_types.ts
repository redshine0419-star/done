export interface VReq {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
  query: Record<string, string | string[]>;
}

export interface VRes {
  status(code: number): VRes;
  json(body: unknown): void;
}
