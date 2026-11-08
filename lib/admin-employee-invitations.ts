import {withActiveAdminUser} from './admin-user-lock';
import {randomBytes,createHash} from 'node:crypto';
import {isPostgres,storeEnv} from '../db/platform-store';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash=(token:string)=>createHash('sha256').update('skp-employee-invite-v1:').update(token).digest('hex');
const LIFETIME_MINUTES=15;

/** Only call after an independent active owner session check.
 * Returns the raw token once; only its digest is persisted.
 * An invite does not itself grant a session or a Passkey.
 */
export async function issueEmployeeInvitation(ownerId:string,employeeId:string):Promise<string|null>{
 if(!isPostgres())throw new Error('PostgreSQL required');
 if(!uuid.test(ownerId)||!uuid.test(employeeId)||ownerId===employeeId)return null;
 return withActiveAdminUser(employeeId,async()=>{
 const token=randomBytes(32).toString('hex');
 const {DB}=await storeEnv();
 const inserted=await DB.prepare(`INSERT INTO skp_admin_employee_invites
  (user_id,token_hash,created_by,expires_at)
  SELECT target.id,?,owner.id,now()+interval '15 minutes'
  FROM skp_admin_users owner
  CROSS JOIN skp_admin_users target
  WHERE owner.id=?::uuid AND owner.role='owner' AND owner.status='active'
   AND target.id=?::uuid AND target.role='admin' AND target.status='active'
  RETURNING id`)
  .bind(hash(token),ownerId,employeeId).first<{id:string}>();
 return inserted?token:null;
 },null);
}

/** Checks an invite without consuming it. The final WebAuthn registration
 * must consume the invite and bind the verified credential atomically.
 */
export async function findValidEmployeeInvitation(token:string):Promise<string|null>{
 if(!isPostgres()||!/^[a-f0-9]{64}$/.test(token))return null;
 const {DB}=await storeEnv();
 const row=await DB.prepare(`SELECT i.user_id FROM skp_admin_employee_invites i
  JOIN skp_admin_users u ON u.id=i.user_id
  WHERE i.token_hash=? AND i.consumed_at IS NULL AND i.revoked_at IS NULL
   AND i.expires_at>now() AND u.status='active' AND u.role IN ('owner','admin')`)
  .bind(hash(token)).first<{user_id:string}>();
 return row?.user_id??null;
}
