declare module 'selfsigned' {
  interface GenerateResult {
    private: string;
    public: string;
    cert: string;
    fingerprint: string;
  }

  interface GenerateOptions {
    days?: number;
    keySize?: number;
    extensions?: any[];
    algorithm?: string;
    pkcs7?: boolean;
    clientCertificate?: boolean;
    clientCertificateCN?: string;
  }

  interface Attribute {
    name: string;
    value: string;
  }

  function generate(attrs: Attribute[], options?: GenerateOptions): GenerateResult;

  export = { generate };
}
