import setupOAuth from '@infra/integrations/oauth/google-oauth.strategy';
import reporter from '@infra/integrations/sentry/sentry-reporter';
import logger from '@infra/observability/logger';
import setupServer, {
  createApplication as exportedCreateApplication,
} from '@infra/server';
import createBullMqServerAdapter from '@infra/server/bull-dashboard';
import { makeRuntimeHealth } from '@infra/server/health';

const mockListen = jest.fn();
const mockDashboardRouter = { router: 'dashboard' };
const mockHealthRouter = { router: 'health' };
const mockMcpRouter = { router: 'mcp' };
const mockMarkStartupComplete = jest.fn();
const mockMarkStartupFailed = jest.fn();

jest.mock('@infra/ioc/mcp', () => ({
  __esModule: true,
  default: { router: 'mcp' },
}));

jest.mock('@infra/integrations/oauth/google-oauth.strategy', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../config/vars.config', () => ({
  __esModule: true,
  default: { PORT: 3_000 },
}));

jest.mock('../../observability/logger', () => ({
  __esModule: true,
  default: { info: jest.fn() },
}));

jest.mock('@infra/integrations/sentry/sentry-reporter', () => ({
  __esModule: true,
  default: { report: jest.fn() },
}));

jest.mock('../../../interface/http/application', () => ({
  __esModule: true,
  default: jest.fn(() => ({ listen: mockListen })),
}));

jest.mock('../bull-dashboard', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getRouter: jest.fn(() => mockDashboardRouter),
  })),
}));

jest.mock('../health', () => ({
  makeRuntimeHealth: jest.fn(() => ({
    markStartupComplete: mockMarkStartupComplete,
    markStartupFailed: mockMarkStartupFailed,
    router: mockHealthRouter,
  })),
}));

function getListenCallback(): () => Promise<void> {
  const callback = mockListen.mock.calls[0][1];
  if (!callback) throw new Error('Expected server listen callback');
  return callback;
}

function getMockCreateApplication(): jest.Mock {
  return jest.requireMock('../../../interface/http/application').default;
}

describe('server setup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mounts runtime health and marks readiness after bootstrap', async () => {
    const bootstrap = jest.fn().mockResolvedValue(undefined);

    setupServer(bootstrap);

    expect(setupOAuth).toHaveBeenCalledTimes(1);
    expect(exportedCreateApplication).toBe(getMockCreateApplication());
    expect(createBullMqServerAdapter).toHaveBeenCalledTimes(1);
    expect(makeRuntimeHealth).toHaveBeenCalledTimes(1);
    expect(getMockCreateApplication()).toHaveBeenCalledWith({
      bullMqDashboardRouter: mockDashboardRouter,
      healthRouter: mockHealthRouter,
      mcpRouter: mockMcpRouter,
    });
    expect(mockListen).toHaveBeenCalledWith(3_000, expect.any(Function));

    await getListenCallback()();

    expect(bootstrap).toHaveBeenCalledTimes(1);
    expect(mockMarkStartupComplete).toHaveBeenCalledTimes(1);
    expect(mockMarkStartupFailed).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('runtime.server.started', {
      port: 3_000,
      outcome: 'success',
    });
  });

  it('keeps readiness false, reports, and preserves startup failure', async () => {
    const error = new Error('bootstrap failed');
    setupServer(jest.fn().mockRejectedValue(error));

    await expect(getListenCallback()()).rejects.toBe(error);

    expect(mockMarkStartupFailed).toHaveBeenCalledTimes(1);
    expect(mockMarkStartupComplete).not.toHaveBeenCalled();
    expect(reporter.report).toHaveBeenCalledWith(
      'runtime.startup.failed',
      error,
      { source: 'application-bootstrap' }
    );
  });

  it('can become ready when no bootstrap callback is supplied', async () => {
    setupServer();

    await getListenCallback()();

    expect(mockMarkStartupComplete).toHaveBeenCalledTimes(1);
  });
});
