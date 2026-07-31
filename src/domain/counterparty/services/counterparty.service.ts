import contractorEntity from '../entities/contractor.entity';
import counterpartyEntity from '../entities/counterparty.entity';
import employerEntity from '../entities/employer.entity';
import vendorEntity from '../entities/vendor.entity';
import { ECounterpartyEntityActions } from '../types/counterparty-audit.types';
import ICounterpartyService from '../types/counterparty.service.types';
import {
  ECounterpartyRole,
  ECounterpartyType,
} from '../types/counterparty.types';
import counterpartyAuditValue from '../values/counterparty-audit.vo';

export default function makeCounterpartyService(): ICounterpartyService {
  return {
    createIndividual(payload) {
      return counterpartyEntity.make({
        ...payload,
        type: ECounterpartyType.Individual,
      });
    },

    createVendor(payload, vendorDetails) {
      const [counterparty, makeEvents] = counterpartyEntity.make(payload);
      const [updatedCounterparty, addRoleEvents] = counterpartyEntity.addRole(
        counterparty,
        ECounterpartyRole.Vendor
      );

      const vendor = vendorEntity.make({
        ...vendorDetails,
        counterPartyId: updatedCounterparty.id,
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
        counterPartyId: updatedCounterparty.id,
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
        counterPartyId: updatedCounterparty.id,
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
