import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EnvironmentVault } from '../types';
import { useAuditStore } from './useAuditStore';
import { v4 as uuidv4 } from 'uuid';

interface VaultState {
  environments: EnvironmentVault[];
  addEnvironment: (env: Omit<EnvironmentVault, 'id'>) => void;
  updateEnvironment: (id: string, env: Partial<EnvironmentVault>) => void;
  deleteEnvironment: (id: string) => void;
  loadDemoEnvironments: () => void;
}

const initialEnvironments: EnvironmentVault[] = [
  {
    id: 'env-prod-01',
    envName: 'Production-01',
    baseUrl: 'https://api.prod.example.com',
    username: 'admin',
    secretKey: 'prod_secret_key_12345',
  },
  {
    id: 'env-stage-01',
    envName: 'Staging',
    baseUrl: 'https://api.staging.example.com',
    username: 'test_admin',
    secretKey: 'stage_secret_key_abcde',
  },
];

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      environments: initialEnvironments,
      addEnvironment: (env) =>
        set((state) => {
          const newEnv = { ...env, id: uuidv4() };
          useAuditStore.getState().addLog(
            'vault_created',
            newEnv.envName,
            `Created environment credentials for ${newEnv.envName} (${newEnv.baseUrl})`,
            'info'
          );
          return { environments: [...state.environments, newEnv] };
        }),
      updateEnvironment: (id, updatedEnv) =>
        set((state) => {
          const existing = state.environments.find((e) => e.id === id);
          if (existing) {
            useAuditStore.getState().addLog(
              'vault_updated',
              existing.envName,
              `Updated credentials configuration for ${existing.envName}`,
              'warning'
            );
          }
          return {
            environments: state.environments.map((env) =>
              env.id === id ? { ...env, ...updatedEnv } : env
            ),
          };
        }),
      deleteEnvironment: (id) =>
        set((state) => {
          const existing = state.environments.find((e) => e.id === id);
          if (existing) {
            useAuditStore.getState().addLog(
              'vault_deleted',
              existing.envName,
              `Deleted credentials configuration for ${existing.envName}`,
              'critical'
            );
          }
          return {
            environments: state.environments.filter((env) => env.id !== id),
          };
        }),
      loadDemoEnvironments: () => {
        set({ environments: initialEnvironments });
        useAuditStore.getState().addLog(
          'vault_created',
          'SYSTEM',
          'Restored sample environment credentials vault',
          'info'
        );
      },
    }),
    {
      name: 'vault-storage',
    }
  )
);
