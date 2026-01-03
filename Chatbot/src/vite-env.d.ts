/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND: string
  readonly VITE_GEMINI_KEY: string
  readonly VITE_FRONTEND: string
  // add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
