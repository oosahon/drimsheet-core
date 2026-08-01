import { ICounterparty } from '../../../../../domain/counterparty/types/counterparty.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import counterpartyDtoMapper from '../counterparty.dto.mapper';

describe('Counterparty DTO Mapper', () => {
  describe('toDto', () => {
    it('should map counterparty domain entity to DTO correctly', () => {
      const mockCounterparty: ICounterparty = {
        id: 'cp-id-123' as unknown as TEntityId,
        accountingEntityId: 'ae-id-456' as unknown as TEntityId,
        name: 'John Doe',
        status: 'active',
        type: 'individual',
        roles: [],
        createdAt: new Date('2026-08-01T08:00:00Z'),
        updatedAt: new Date('2026-08-01T08:00:00Z'),
      };

      const dto = counterpartyDtoMapper.toDto(mockCounterparty);

      expect(dto).toEqual({
        id: 'cp-id-123',
        accountingEntityId: 'ae-id-456',
        name: 'John Doe',
        status: 'active',
        type: 'individual',
        roles: [],
        createdAt: new Date('2026-08-01T08:00:00Z'),
        updatedAt: new Date('2026-08-01T08:00:00Z'),
      });
    });

    it('should preserve roles list', () => {
      const mockCounterparty: ICounterparty = {
        id: 'cp-id-123' as unknown as TEntityId,
        accountingEntityId: 'ae-id-456' as unknown as TEntityId,
        name: 'Vendor Corp',
        status: 'active',
        type: 'organization',
        roles: ['vendor'],
        createdAt: new Date('2026-08-01T08:00:00Z'),
        updatedAt: new Date('2026-08-01T08:00:00Z'),
      };

      const dto = counterpartyDtoMapper.toDto(mockCounterparty);
      expect(dto.roles).toEqual(['vendor']);
    });
  });
});
