import { ContactMessageService, CreateContactMessageResult } from '@/services/ContactMessageService';

// Pure-logic unit tests for the spam/duplicate/throttle decision in
// ContactMessageService.createContactMessage — no database. The repository is
// stubbed and the service is built via Object.create so the DB-touching
// constructor never runs.

interface RepoStub {
  findRecentDuplicate: (email: string, message: string) => Promise<{ id: string } | null>;
  countRecentByEmail: (email: string) => Promise<number>;
  create: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

function buildService(repo: Partial<RepoStub>): ContactMessageService {
  const svc = Object.create(ContactMessageService.prototype) as ContactMessageService;
  (svc as unknown as { repository: Partial<RepoStub> }).repository = repo;
  return svc;
}

const validBody = {
  name: 'Valid Sender',
  email: 'Sender@Example.com',
  message: 'This is a sufficiently long message.',
  subject: 'Hello there',
};

describe('ContactMessageService.createContactMessage — duplicate / throttle / clean', () => {
  it('returns "duplicate" when a matching message exists within the last hour', async () => {
    const svc = buildService({
      findRecentDuplicate: async () => ({ id: 'dup-1' }),
      countRecentByEmail: async () => 0,
      create: async () => ({ id: 'should-not-be-created' }),
    });
    const result: CreateContactMessageResult = await svc.createContactMessage({ ...validBody });
    expect(result.status).toBe('duplicate');
  });

  it('returns "throttled" when the email already sent 5+ messages in the last hour', async () => {
    const svc = buildService({
      findRecentDuplicate: async () => null,
      countRecentByEmail: async () => 5,
      create: async () => ({ id: 'should-not-be-created' }),
    });
    const result = await svc.createContactMessage({ ...validBody });
    expect(result.status).toBe('throttled');
  });

  it('passes through to "created" when not a duplicate and under the throttle limit', async () => {
    let created = false;
    const svc = buildService({
      findRecentDuplicate: async () => null,
      countRecentByEmail: async () => 4,
      create: async (data) => {
        created = true;
        return { id: 'new-msg', ...data };
      },
    });
    const result = await svc.createContactMessage({ ...validBody });
    expect(result.status).toBe('created');
    expect(created).toBe(true);
    if (result.status === 'created') {
      // email is normalised to lowercase, message trimmed
      expect(result.contactMessage).toMatchObject({ email: 'sender@example.com' });
    }
  });

  it('checks the duplicate guard before the throttle guard (dup wins)', async () => {
    const svc = buildService({
      findRecentDuplicate: async () => ({ id: 'dup-2' }),
      countRecentByEmail: async () => 99,
      create: async () => ({ id: 'x' }),
    });
    const result = await svc.createContactMessage({ ...validBody });
    expect(result.status).toBe('duplicate');
  });
});
