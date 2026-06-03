export type StagingSmokeStep = {
  args: string[];
  command: string;
  failureHint: string;
  label: string;
  purpose: string;
};

export function createStagingSmokeSteps(targetBaseUrl?: string): StagingSmokeStep[];

export function loadShipperAccountDefaults(env?: Record<string, string | undefined>): Record<string, string>;
