import generateUUID from '@shared/utils/uuid-generator';
import { IAddress } from '@shared/values/contact-details/types/address.types';

import makeCounterpartyService from '@domain/counterparty/services/counterparty.service';
import {
  ECounterpartyRole,
  ECounterpartyType,
} from '@domain/counterparty/types/counterparty.types';

describe('Counterparty Service', () => {
  const accountingEntityId = generateUUID();
  const service = makeCounterpartyService();

  const address: IAddress = {
    line1: '123 Main St',
    line2: null,
    city: 'San Francisco',
    region: 'CA',
    postalCode: '94105',
    countryCode: 'US',
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-31T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should successfully create an individual counterparty', () => {
      const payload = {
        accountingEntityId,
        name: 'John Doe',
        type: ECounterpartyType.Individual,
      };

      const [counterparty, events, audit] = service.create(payload);

      expect(counterparty.name).toBe('John Doe');
      expect(counterparty.type).toBe(ECounterpartyType.Individual);
      expect(counterparty.roles).toEqual([]);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('domain:counterparty:created');
      expect(audit.action).toBe('created');
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(counterparty);
    });
  });

  describe('createVendor', () => {
    it('should successfully create a vendor counterparty with vendor details', () => {
      const payload = {
        accountingEntityId,
        name: 'Acme Vendor',
        type: ECounterpartyType.Organization,
      };
      const vendorDetails = {
        address,
      };

      const { counterparty: auditedCounterparty, vendor } =
        service.createVendor(payload, vendorDetails);

      const [counterparty, events, audit] = auditedCounterparty;
      const [vendorDetailsObj, vendorEvents, vendorAudit] = vendor;

      expect(counterparty.name).toBe('Acme Vendor');
      expect(counterparty.roles).toEqual([ECounterpartyRole.Vendor]);
      expect(vendorDetailsObj.counterpartyId).toBe(counterparty.id);
      expect(vendorDetailsObj.address).toEqual(address);

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('domain:counterparty:created');
      expect(events[1].type).toBe('domain:counterparty:role-added');

      expect(audit.action).toBe('created');
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(counterparty);

      expect(vendorEvents).toHaveLength(1);
      expect(vendorEvents[0].type).toBe('domain:counterparty:vendor:created');
      expect(vendorEvents[0].data).toEqual(vendorDetailsObj);

      expect(vendorAudit.action).toBe('created');
      expect(vendorAudit.diff.before).toBeNull();
      expect(vendorAudit.diff.after).toEqual(vendorDetailsObj);
    });

    it('should allow null address for vendor', () => {
      const payload = {
        accountingEntityId,
        name: 'Acme Vendor',
        type: ECounterpartyType.Organization,
      };
      const vendorDetails = {
        address: null,
      };

      const { vendor } = service.createVendor(payload, vendorDetails);
      const [vendorDetailsObj] = vendor;
      expect(vendorDetailsObj.address).toBeNull();
    });
  });

  describe('createContractor', () => {
    it('should successfully create a contractor counterparty with contractor details', () => {
      const payload = {
        accountingEntityId,
        name: 'Bob Builder',
        type: ECounterpartyType.Individual,
      };
      const contractorDetails = {
        address,
      };

      const { counterparty: auditedCounterparty, contractor } =
        service.createContractor(payload, contractorDetails);

      const [counterparty, events, audit] = auditedCounterparty;
      const [contractorDetailsObj, contractorEvents, contractorAudit] =
        contractor;

      expect(counterparty.name).toBe('Bob Builder');
      expect(counterparty.roles).toEqual([ECounterpartyRole.Contractor]);
      expect(contractorDetailsObj.counterpartyId).toBe(counterparty.id);
      expect(contractorDetailsObj.address).toEqual(address);

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('domain:counterparty:created');
      expect(events[1].type).toBe('domain:counterparty:role-added');

      expect(audit.action).toBe('created');
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(counterparty);

      expect(contractorEvents).toHaveLength(1);
      expect(contractorEvents[0].type).toBe(
        'domain:counterparty:contractor:created'
      );
      expect(contractorEvents[0].data).toEqual(contractorDetailsObj);

      expect(contractorAudit.action).toBe('created');
      expect(contractorAudit.diff.before).toBeNull();
      expect(contractorAudit.diff.after).toEqual(contractorDetailsObj);
    });
  });

  describe('createEmployer', () => {
    it('should successfully create an employer counterparty with employer details', () => {
      const payload = {
        accountingEntityId,
        name: 'MegaCorp Inc',
        type: ECounterpartyType.Organization,
      };
      const employerDetails = {
        displayName: 'MegaCorp',
        address,
      };

      const { counterparty: auditedCounterparty, employer } =
        service.createEmployer(payload, employerDetails);

      const [counterparty, events, audit] = auditedCounterparty;
      const [employerDetailsObj, employerEvents, employerAudit] = employer;

      expect(counterparty.name).toBe('MegaCorp Inc');
      expect(counterparty.roles).toEqual([ECounterpartyRole.Employer]);
      expect(employerDetailsObj.counterpartyId).toBe(counterparty.id);
      expect(employerDetailsObj.displayName).toBe('MegaCorp');
      expect(employerDetailsObj.address).toEqual(address);

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('domain:counterparty:created');
      expect(events[1].type).toBe('domain:counterparty:role-added');

      expect(audit.action).toBe('created');
      expect(audit.diff.before).toBeNull();
      expect(audit.diff.after).toEqual(counterparty);

      expect(employerEvents).toHaveLength(1);
      expect(employerEvents[0].type).toBe(
        'domain:counterparty:employer:created'
      );
      expect(employerEvents[0].data).toEqual(employerDetailsObj);

      expect(employerAudit.action).toBe('created');
      expect(employerAudit.diff.before).toBeNull();
      expect(employerAudit.diff.after).toEqual(employerDetailsObj);
    });
  });
});
