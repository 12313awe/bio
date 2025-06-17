/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FLOW_ID: string;
  readonly VITE_LANGFLOW_BASE_URL: string;
  readonly VITE_LANGFLOW_API_KEY: string;
  readonly VITE_HF_TOKEN: string;
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
