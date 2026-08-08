import contractorEntity from '@domain/counterparty/entities/contractor.entity';
import counterpartyEntity from '@domain/counterparty/entities/counterparty.entity';
import employerEntity from '@domain/counterparty/entities/employer.entity';
import vendorEntity from '@domain/counterparty/entities/vendor.entity';
import { ECounterpartyEntityActions } from '@domain/counterparty/types/counterparty-audit.types';
import ICounterpartyService from '@domain/counterparty/types/counterparty.service.types';
import { ECounterpartyRole } from '@domain/counterparty/types/counterparty.types';
import counterpartyAuditValue from '@domain/counterparty/values/counterparty-audit.vo';

export default function makeCounterpartyService(): ICounterpartyService {
  return {
    create(payload) {
      return counterpartyEntity.make(payload);
    },

    createVendor(payload, vendorDetails) {
      const [counterparty, makeEvents] = counterpartyEntity.make(payload);
      const [updatedCounterparty, addRoleEvents] = counterpartyEntity.addRole(
        counterparty,
        ECounterpartyRole.Vendor
      );

      const vendor = vendorEntity.make({
        ...vendorDetails,
        counterpartyId: updatedCounterparty.id,
      });

      const mergedEvents = [...makeEvents, ...addRoleEvents];
      const finalAudit = counterpartyAuditValue.make({
        before: null,
        after: updatedCounterparty,
        action: ECounterpartyEntityActions.Created,
      });

      return {
        counterparty: [updatedCounterparty, mergedEvents, finalAudit],
        vendor,
      };
    },

    createContractor(payload, contractorDetails) {
      const [counterparty, makeEvents] = counterpartyEntity.make(payload);
      const [updatedCounterparty, addRoleEvents] = counterpartyEntity.addRole(
        counterparty,
        ECounterpartyRole.Contractor
      );

      const contractor = contractorEntity.make({
        ...contractorDetails,
        counterpartyId: updatedCounterparty.id,
      });

      const mergedEvents = [...makeEvents, ...addRoleEvents];
      const finalAudit = counterpartyAuditValue.make({
        before: null,
        after: updatedCounterparty,
        action: ECounterpartyEntityActions.Created,
      });

      return {
        counterparty: [updatedCounterparty, mergedEvents, finalAudit],
        contractor,
      };
    },

    createEmployer(payload, employerDetails) {
      const [counterparty, makeEvents] = counterpartyEntity.make(payload);
      const [updatedCounterparty, addRoleEvents] = counterpartyEntity.addRole(
        counterparty,
        ECounterpartyRole.Employer
      );

      const employer = employerEntity.make({
        ...employerDetails,
        counterpartyId: updatedCounterparty.id,
      });

      const mergedEvents = [...makeEvents, ...addRoleEvents];
      const finalAudit = counterpartyAuditValue.make({
        before: null,
        after: updatedCounterparty,
        action: ECounterpartyEntityActions.Created,
      });

      return {
        counterparty: [updatedCounterparty, mergedEvents, finalAudit],
        employer,
      };
    },
  };
}
