/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLIENT_ID: string
  readonly VITE_TENANT_ID: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}