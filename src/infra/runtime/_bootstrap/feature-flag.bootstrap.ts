import featureFlagLifecycle from '@infra/runtime/feature-flag-lifecycle';

export default async function bootstrapFeatureFlags() {
  await featureFlagLifecycle.initialize();
  featureFlagLifecycle.registerShutdown();
}
