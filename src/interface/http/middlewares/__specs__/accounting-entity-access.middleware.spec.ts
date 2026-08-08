import makeAccountingEntityAccessMiddleware from '@interface/http/middlewares/accounting-entity-access.middleware';

describe('makeAccountingEntityAccessMiddleware', () => {
  let mockAppContext: any;
  let mockAccountingEntityService: any;
  let middleware: ReturnType<typeof makeAccountingEntityAccessMiddleware>;
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext = {
      get: jest.fn(),
    };
    mockAccountingEntityService = {
      validateAccess: jest.fn(),
    };
    req = {};
    res = {};
    next = jest.fn();
    middleware = makeAccountingEntityAccessMiddleware(
      mockAccountingEntityService,
      mockAppContext
    );
  });

  it('validates access and calls next()', async () => {
    mockAppContext.get.mockReturnValue({
      user: { id: 'user-id' },
      accountingEntity: { id: 'entity-id' },
    });

    await middleware(req, res, next);

    expect(mockAccountingEntityService.validateAccess).toHaveBeenCalledWith(
      { id: 'entity-id' },
      'user-id'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('propagates error when validation fails', async () => {
    mockAppContext.get.mockReturnValue({
      user: { id: 'user-id' },
      accountingEntity: { id: 'entity-id' },
    });
    const error = new Error('No access');
    mockAccountingEntityService.validateAccess.mockImplementation(() => {
      throw error;
    });

    await expect(middleware(req, res, next)).rejects.toThrow('No access');
    expect(next).not.toHaveBeenCalled();
  });
});
