import generateUUID from '@shared/utils/uuid-generator';
import addressValue from '@shared/values/contact-details/address.vo';

import makeCounterpartyService from '@domain/counterparty/services/counterparty.service';

const service = makeCounterpartyService();
const payload = {
  accountingEntityId: generateUUID(),
  name: 'Example',
  type: 'organization' as const,
};
const address = addressValue.make({
  line1: 'Main Street',
  city: 'Lagos',
  countryCode: 'NG',
});

describe('Counterparty service', () => {
  it('creates a role-less counterparty with one creation event and audit', () => {
    const [counterparty, events, audit] = service.create(payload);
    expect(counterparty.meta).toEqual({});
    expect(counterparty.roles).toEqual([]);
    expect(events.map((event) => event.type)).toEqual([
      'domain:counterparty:created',
    ]);
    expect(audit.diff).toEqual({ before: null, after: counterparty });
  });

  it.each(['vendor', 'employer', 'contractor'] as const)(
    'creates an audited %s with immutable details',
    (role) => {
      const creation =
        role === 'vendor'
          ? service.create({ ...payload, meta: { vendor: { address } } })
          : role === 'employer'
            ? service.create({
                ...payload,
                meta: {
                  employer: {
                    address,
                    displayName: ' Example ',
                  },
                },
              })
            : service.create({ ...payload, meta: { contractor: { address } } });
      const [counterparty, events, audit] = creation;
      expect(counterparty.roles).toEqual([role]);
      expect(counterparty.meta[role]?.address).toEqual(address);
      expect(Object.isFrozen(counterparty.meta[role]?.address)).toBe(true);
      expect(events.map((event) => event.type)).toEqual([
        'domain:counterparty:created',
        'domain:counterparty:role-added',
      ]);
      expect(events[1].data).toEqual(counterparty);
      expect(audit.diff).toEqual({ before: null, after: counterparty });
      expect(audit.action).toBe('created');
    }
  );

  it('allows a vendor without an address', () => {
    const [counterparty] = service.create({
      ...payload,
      meta: { vendor: { address: null } },
    });
    expect(counterparty.meta).toEqual({ vendor: { address: null } });
  });
});

describe('metadata-driven creation', () => {
  const rawAddress = {
    line1: ' Main Street ',
    city: ' Lagos ',
    countryCode: 'ng',
  };

  it('accepts empty metadata without assigning a role', () => {
    const [counterparty, events] = service.create({ ...payload, meta: {} });
    expect(counterparty.roles).toEqual([]);
    expect(counterparty.status).toBe('active');
    expect(events).toHaveLength(1);
  });

  it.each([1, 2, 3, 4, 5, 6, 7])(
    'creates role combination %i with ordered immutable transitions',
    (mask) => {
      const meta: NonNullable<Parameters<typeof service.create>[0]['meta']> =
        {};
      // Deliberately supply keys in reverse order.
      if (mask & 4)
        meta.contractor = {
          address: { ...rawAddress, line1: ' Contractor Road ' },
        };
      if (mask & 2) meta.vendor = {};
      if (mask & 1)
        meta.employer = { address: rawAddress, displayName: ' Employer ' };
      const before = structuredClone(meta);
      const [counterparty, events, audit] = service.create({
        ...payload,
        meta,
      });
      const expectedRoles = (
        ['employer', 'vendor', 'contractor'] as const
      ).filter((_, i) => mask & (1 << i));
      expect(counterparty.roles).toEqual(expectedRoles);
      expect(events).toHaveLength(expectedRoles.length + 1);
      expect(events[0].data.roles).toEqual([]);
      for (let i = 0; i < expectedRoles.length; i++) {
        expect(events[i + 1].type).toBe('domain:counterparty:role-added');
        expect(events[i + 1].data.roles).toEqual(expectedRoles.slice(0, i + 1));
        expect(Object.isFrozen(events[i + 1].data.meta)).toBe(true);
      }
      expect(audit.action).toBe('created');
      expect(audit.diff).toEqual({ before: null, after: counterparty });
      expect(meta).toEqual(before);
      if (meta.employer)
        expect(counterparty.meta.employer).toEqual({
          displayName: 'Employer',
          address,
        });
      if (meta.vendor)
        expect(counterparty.meta.vendor).toEqual({ address: null });
      if (meta.contractor)
        expect(counterparty.meta.contractor?.address).toEqual({
          ...address,
          line1: 'Contractor Road',
        });
    }
  );

  it.each([
    null,
    [],
    new Date(),
    'vendor',
    { customer: {} },
    { employer: null },
    { vendor: undefined },
    { vendor: null },
    { contractor: [] },
    { vendor: { unknown: 1 } },
    { employer: { address: rawAddress, displayName: 2 } },
    { employer: {} },
    { contractor: { address: null } },
    { vendor: { address: { ...rawAddress, extra: true } } },
    { contractor: { address: { ...rawAddress, line2: 42 } } },
    { contractor: { address: { ...rawAddress, region: [] } } },
    { vendor: { address: { ...rawAddress, postalCode: {} } } },
    { employer: { address: { ...rawAddress, line1: '' } } },
    {
      vendor: {},
      contractor: { address: { ...rawAddress, countryCode: 'invalid' } },
    },
  ])('rejects the entire creation for invalid raw metadata %j', (meta) => {
    expect(() =>
      service.create({ ...payload, meta } as unknown as Parameters<
        typeof service.create
      >[0])
    ).toThrow();
  });
});
